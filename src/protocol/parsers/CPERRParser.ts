// src/protocol/parsers/CPERRParser.ts

import { ParsedCPERR, CPERRCode, CPERRDescription, TMHeader, IPacketParser } from "../../types/index.js";
import { PacketParser } from "./packet-parser.js";

export class CPERRParser {
  private parser: IPacketParser;

  constructor(packetParser: IPacketParser = new PacketParser()) {
    this.parser = packetParser;
  }

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