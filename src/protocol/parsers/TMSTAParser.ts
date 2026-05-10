// src/protocol/parsers/TMSTAParser.ts

import { ParsedTMSTA, TM_STA_CUSTOM, TMSTASubCmd, TM_TAGS, TMTagNumber, TMHeader, IPacketParser } from "../../types/index.js";
import { TMParseError, TMSTAError } from "../../errors/techman-errors.js";
import { PacketParser } from "./packet-parser.js";

/**
 * Парсер для пакетов TMSTA (TM Status).
 * Используется для получения информации о состоянии проекта, тегах и других системных данных.
 */
export class TMSTAParser {
  private parser: IPacketParser;

  constructor(packetParser: IPacketParser = new PacketParser()) {
    this.parser = packetParser;
  }

  /**
   * Разбирает пакеты статуса на основе Sub-Command (00, 01 или Custom).
   * 
   * @param raw - Строка пакета $TMSTA...
   * @throws {TMSTAError} При неизвестном SubCmd или недопустимом номере тега.
   * @throws {TMParseError} При неверном формате данных внутри подкоманды.
   */
  public parse(raw: string): ParsedTMSTA {
    const { parts } = this.parser.parse(raw);

    const subCmdRaw = parts[2];
    if (subCmdRaw !== '00' && subCmdRaw !== '01' && !(TM_STA_CUSTOM as readonly string[]).includes(subCmdRaw)) throw new TMSTAError(`Unsupported TMSTA subCmd: ${subCmdRaw}`);

    const subCmd = subCmdRaw as TMSTASubCmd;
    let content: ParsedTMSTA['content'];

    if (subCmd === '00') {
      content = {
        entry: parts[3] === 'true',
        ...(parts[4] && { message: parts[4] })
      };
    }
    else if (subCmd === '01') {
      if (parts.length < 5) throw new TMParseError("TMSTA 01 packet missing status part");

      const tagRaw = parts[3];
      const statusRaw = parts[4] as 'true' | 'false' | 'none';

      if (!(TM_TAGS as readonly string[]).includes(tagRaw)) throw new TMSTAError(`Invalid tag: ${tagRaw}. Expected 01-15.`);
      if (statusRaw !== 'true' && statusRaw !== 'false' && statusRaw !== 'none') throw new TMParseError(`Unexpected TMSTA status value: ${statusRaw}`);

      content = { tagNumber: tagRaw as TMTagNumber, status: statusRaw === 'true' ? true : (statusRaw === 'none' ? 'none' : false) };
    }
    else {
      content = { rawData: parts.slice(3).join(',') };
    }

    return {
      header: TMHeader.Status,
      subCmd, content
    };
  }
}