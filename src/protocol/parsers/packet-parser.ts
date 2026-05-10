// src/protocol/parsers/PacketParser.ts

import { ParsedSpecificPacket, TMHeader } from "../../types/index.js";
import { TMParseError } from '../../errors/techman-errors.js';
import { TMSCTParser } from "./TMSCTParser.js";
import { TMSTAParser } from "./TMSTAParser.js";
import { TMSVRParser } from "./TMSVRParser.js";
import { CPERRParser } from "./CPERRParser.js";

export abstract class PacketParser {
  private static calculateChecksum(data: string): string {
    const buffer = Buffer.from(data, 'utf8');
    let checksum = 0;
    for (let i = 0; i < buffer.length; i++) {
      checksum ^= buffer[i];
    }
    return checksum.toString(16).toUpperCase().padStart(2, '0');
  }

  private static calculateByteLength(str: string): number {
    return Buffer.byteLength(str, 'utf8');
  }

  protected static parseInitialParts(raw: string): { header: string; content: string; parts: string[] } {
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
} // Good

export class ParserRouter {
  static routeAndParse(raw: string): ParsedSpecificPacket {
    const headerMatch = raw.match(/^\$(\w+),/);
    const header = headerMatch ? headerMatch[1] : '';
    if (!header) throw new TMParseError(`Could not identify packet header: ${raw.substring(0, 20)}...`);

    switch (header) {
      case TMHeader.Script:
        return TMSCTParser.parse(raw);
      case TMHeader.Status:
        return TMSTAParser.parse(raw);
      case TMHeader.Value:
        return TMSVRParser.parse(raw);
      case TMHeader.Error:
        return CPERRParser.parse(raw);
      default:
        throw new TMParseError(`Unsupported protocol header: ${header}`);
    }
  }
} // Good