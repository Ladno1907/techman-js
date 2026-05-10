// src/protocol/parsers/CPERRParser.ts

import { ParsedCPERR, CPERRCode, CPERRDescription, TMHeader, IPacketParser } from "../../types/index.js";
import { PacketParser } from "./packet-parser.js";

/**
 * Парсер для пакетов CPERR (Communication Protocol Error).
 * Обрабатывает системные ошибки протокола, такие как неверный формат или контрольная сумма.
 */
export class CPERRParser {
  private parser: IPacketParser;

  constructor(packetParser: IPacketParser = new PacketParser()) {
    this.parser = packetParser;
  }

  /**
   * Разбирает пакет ошибки и сопоставляет код ошибки с человекочитаемым описанием.
   * @param raw - Строка пакета $CPERR...
   */
  public parse(raw: string): ParsedCPERR {
    const { parts } = this.parser.parse(raw);

    const errorCode = parts[2] as CPERRCode;
    const message = CPERRDescription[errorCode] || `Unknown Error (${errorCode})`;

    return {
      header: TMHeader.Error,
      errorCode,
      message
    };
  }
}