// src/protocol/parsers/TMSVRParser.ts

import { TMSVRErrorCode, TMSVRDescription, ParsedTMSVR, TMHeader, IPacketParser } from "../../types/index.js";
import { PacketParser } from "./packet-parser.js";

/**
 * Парсер для пакетов TMSVR (TM Status Value Read).
 * Предназначен для чтения значений переменных, параметров системы и обработки ошибок доступа к данным.
 */
export class TMSVRParser {
  private parser: IPacketParser;

  constructor(packetParser: IPacketParser = new PacketParser()) {
    this.parser = packetParser;
  }

  /**
   * Разбирает данные переменных. Поддерживает режимы:
   * - 0: Сообщения об ошибках (ErrorCode).
   * - 2/12: Чтение значений в формате "ключ=значение".
   * 
   * @param raw - Строка пакета $TMSVR...
   * @throws {Error} Если режим (mode) не поддерживается парсером (не 0, 2 или 12).
   * 
   * @example
   * // Чтение нескольких переменных
   * const res = parser.parse("$TMSVR,20,ID,2,Var1=10\nVar2=20*CC");
   */
  public parse(raw: string): ParsedTMSVR {
    const { parts } = this.parser.parse(raw);

    const id = parts[2];
    const mode = parseInt(parts[3], 10) as 0 | 2 | 12;

    if (![0, 2, 12].includes(mode)) {
      throw new Error(`Unsupported TMSVR mode: ${mode}. Only string modes (0, 2, 12) are supported.`);
    }

    if (mode === 0) {
      const errorCode = parts[4] as TMSVRErrorCode;
      const errorDescription = parts.slice(5).join(',');

      let item: string | undefined;
      let message = TMSVRDescription[errorCode] || `Unknown Error (${errorCode})`;

      if (errorDescription.includes(';')) {
        const [desc, itemName] = errorDescription.split(';');
        message = desc;
        item = itemName;
      } else if (errorDescription) {
        message = errorDescription;
      }

      return {
        header: TMHeader.Value,
        id,
        mode: 0,
        ok: errorCode === TMSVRErrorCode.OK,
        error: {
          code: errorCode,
          message,
          ...(item && { item })
        }
      };
    }

    const content = parts.slice(4).join(',');

    const items: Array<{ item: string; value: string }> = [];

    const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
    
    for (const line of lines) {
      const eqIndex = line.indexOf('=');
      if (eqIndex === -1) {
        continue;
      }
      
      const item = line.substring(0, eqIndex).trim();
      const value = line.substring(eqIndex + 1).trim();
      
      items.push({ item, value });
    }

    return {
      header: TMHeader.Value,
      id,
      mode,
      ok: true,
      items: items.length > 0 ? items : undefined
    };
  }
}