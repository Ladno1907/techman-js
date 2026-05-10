// src/protocol/parsers/CPERRParser.ts

import { ParsedCPERR, CPERRCode, CPERRDescription, TMHeader } from "../../types/index.js";
import { PacketParser } from "./packet-parser.js";

export class CPERRParser extends PacketParser {
  public static parse(raw: string): ParsedCPERR {
    const { parts } = this.parseInitialParts(raw);

    const errorCode = parts[2] as CPERRCode;
    const message = CPERRDescription[errorCode] || `Unknown Error (${errorCode})`;

    return {
      header: TMHeader.Error,
      errorCode,
      message
    };
  }
} // Good