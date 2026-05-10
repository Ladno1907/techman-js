// src/protocol/parsers/PacketParser.ts

import { IPacketParser, IParserRouter, ParsedSpecificPacket, TMHeader, ISpecificParser } from "../../types/index.js";
import { TMParseError } from '../../errors/techman-errors.js';
import { TMSCTParser } from "./TMSCTParser.js";
import { TMSTAParser } from "./TMSTAParser.js";
import { TMSVRParser } from "./TMSVRParser.js";
import { CPERRParser } from "./CPERRParser.js";

/**
 * Базовый парсер пакетов протокола TM.
 * Отвечает за проверку структуры, валидацию контрольной суммы и извлечение сырых данных.
 */
export class PacketParser implements IPacketParser {
  /**
   * Выполняет первичный разбор сырой строки пакета.
   * 
   * @param raw - Полная строка пакета (например, "$TMSCT,10,ID,data...*CC").
   * @returns Объект с заголовком, полным содержимым и массивом частей.
   * 
   * @throws {TMParseError} Если отсутствуют разделители ($ или *).
   * @throws {TMParseError} Если контрольная сумма (checksum) не совпадает.
   * @throws {TMParseError} Если длина данных не соответствует заявленной в пакете.
   */
  parse(raw: string): { header: string; content: string; parts: string[] } {
    const trimmed = raw.trim();
    if (!trimmed.startsWith('$') || !trimmed.includes('*')) throw new TMParseError('Missing start ($) or end (*) delimiter');

    const starIndex = trimmed.lastIndexOf('*');
    const content = trimmed.substring(1, starIndex);
    const receivedChecksum = trimmed.substring(starIndex + 1);

    const calculatedChecksum = this.calculateChecksum(content);
    if (calculatedChecksum !== receivedChecksum.toUpperCase()) throw new TMParseError(`Checksum mismatch! Expected ${calculatedChecksum}, got ${receivedChecksum}`);

    const parts = content.split(',');
    if (parts.length < 3) throw new TMParseError('Insufficient packet parts (Expected Header, Length, and Data)');

    const reportedLength = parseInt(parts[1], 10);
    if (isNaN(reportedLength)) throw new TMParseError(`Invalid length field: ${parts[1]}`);

    const dataContent = parts.slice(2, -1).join(',');
    const calculatedLength = this.calculateByteLength(dataContent);
    if (reportedLength !== calculatedLength) throw new TMParseError(`Payload length mismatch! Robot reported ${reportedLength}, but calculated ${calculatedLength}`);

    const header = parts[0];
    return { header, content, parts };
  }

  /**
   * Вычисляет контрольную сумму путем XOR-суммирования байтов строки.
   * @param data - Содержимое пакета между '$' и '*'.
   * @internal
   */
  private calculateChecksum(data: string): string {
    const buffer = Buffer.from(data, 'utf8');
    let checksum = 0;
    for (let i = 0; i < buffer.length; i++) {
      checksum ^= buffer[i];
    }
    return checksum.toString(16).toUpperCase().padStart(2, '0');
  }

  /**
   * Вычисляет длину строки в байтах (UTF-8).
   * @internal
   */
  private calculateByteLength(str: string): number {
    return Buffer.byteLength(str, 'utf8');
  }
}

/**
 * Роутер парсеров. Определяет тип пакета по его заголовку 
 * и делегирует разбор специализированному парсеру (TMSCT, TMSTA и т.д.).
 */
export class ParserRouter implements IParserRouter {
  /** 
   * Реестр доступных парсеров, сопоставленных с заголовками TMHeader.
   */
  private readonly parsers: Record<string, ISpecificParser>;

  constructor() {
    const base = new PacketParser();

    this.parsers = {
      [TMHeader.Script]: new TMSCTParser(base),
      [TMHeader.Status]: new TMSTAParser(base),
      [TMHeader.Value]:  new TMSVRParser(base),
      [TMHeader.Error]:  new CPERRParser(base),
    };
  }

  /**
   * Определяет заголовок пакета и направляет его в соответствующий парсер.
   * 
   * @param raw - Сырая строка ответа от робота.
   * @returns Результат парсинга, специфичный для данного типа заголовка.
   * 
   * @throws {TMParseError} Если заголовок не поддерживается или не найден.
   * 
   * @example
   * ```ts
   * const router = new ParserRouter();
   * const result = router.routeAndParse("$TMSTA,2,00*3E");
   * ```
   */
  routeAndParse(raw: string): ParsedSpecificPacket {
    const headerMatch = raw.match(/^\$(\w+),/);
    const header = headerMatch ? headerMatch[1] : '';

    const parser = this.parsers[header];
    
    if (!parser) {
      throw new TMParseError(`Unsupported protocol header: ${header || 'Unknown'}`);
    }

    return parser.parse(raw);
  }
}