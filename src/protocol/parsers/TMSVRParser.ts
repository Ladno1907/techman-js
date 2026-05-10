// src/protocol/parsers/TMSVRParser.ts

import { TMSVRErrorCode, TMSVRDescription, ParsedTMSVR, TMHeader } from "../../types/index.js";
import { PacketParser } from "./packet-parser.js";

export class TMSVRParser extends PacketParser {
  public static parse(raw: string): ParsedTMSVR {
    const { parts } = this.parseInitialParts(raw);

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
} // Naxui