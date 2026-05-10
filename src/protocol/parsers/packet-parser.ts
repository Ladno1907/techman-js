// src/protocol/parsers/PacketParser.ts

import { IPacketParser, IParserRouter, ParsedSpecificPacket, TMHeader, ISpecificParser } from "../../types/index.js";
import { TMParseError } from '../../errors/techman-errors.js';
import { TMSCTParser } from "./TMSCTParser.js";
import { TMSTAParser } from "./TMSTAParser.js";
import { TMSVRParser } from "./TMSVRParser.js";
import { CPERRParser } from "./CPERRParser.js";

export class PacketParser implements IPacketParser {
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

  private calculateChecksum(data: string): string {
    const buffer = Buffer.from(data, 'utf8');
    let checksum = 0;
    for (let i = 0; i < buffer.length; i++) {
      checksum ^= buffer[i];
    }
    return checksum.toString(16).toUpperCase().padStart(2, '0');
  }

  private calculateByteLength(str: string): number {
    return Buffer.byteLength(str, 'utf8');
  }
}

export class ParserRouter implements IParserRouter {
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