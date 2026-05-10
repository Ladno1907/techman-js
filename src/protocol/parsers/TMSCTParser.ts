// src/protocol/parsers/TMSCTParser.ts

import { ParsedTMSCT, TMHeader, IPacketParser } from "../../types/index.js";
import { TMParseError } from "../../errors/techman-errors.js";
import { PacketParser } from "./packet-parser.js";

/**
 * Парсер для пакетов TMSCT (TM Script Language).
 * Обрабатывает ответы на отправленные скрипты или команды управления.
 */
export class TMSCTParser {
  private parser: IPacketParser;
  
  constructor(packetParser: IPacketParser = new PacketParser()) {
    this.parser = packetParser;
  }

  /**
   * Разбирает ответ на скрипт, извлекая ID транзакции и статус выполнения.
   * Поддерживает разбор номеров строк для OK и ERROR ответов.
   * 
   * @param raw - Строка пакета $TMSCT...
   * @throws {TMParseError} Если статус пакета не "OK" и не "ERROR".
   * 
   * @example
   * // Ответ: запуск скрипта выполнен успешно на строках 1 и 2
   * const res = parser.parse("$TMSCT,9,ID,OK;1;2*3C");
   */
  public parse(raw: string): ParsedTMSCT {
    const { parts } = this.parser.parse(raw);

    const id = parts[2];
    const statusPart = parts[3] || ''; 

    let status: 'OK' | 'ERROR';
    let OKLines: number[] | undefined;
    let ERRORLines: number[] | undefined;

    if (statusPart.startsWith('OK')) {
      status = 'OK';
      if (statusPart.includes(';')) {
        OKLines = statusPart.split(';').slice(1).map(Number);
      }
    } 
    else if (statusPart.startsWith('ERROR')) {
      status = 'ERROR';
      if (statusPart.includes(';')) {
        ERRORLines = statusPart.split(';').slice(1).map(Number);
      }
    }
    else {
      throw new TMParseError(`Unexpected TMSCT status: "${statusPart}"`);
    }

    return {
      header: TMHeader.Script,
      id,
      status,
      OKLines,
      ERRORLines
    };
  }
}