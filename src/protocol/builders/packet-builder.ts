// src/protocol/builders/PacketBuilder.ts

import { BuiltPacket } from "../../types/index.js";

export class PacketBuilder {
  private static readonly CLIENT_ID = 'NodeJS';
  private static nextId: number = 0;

  static build(header: string, payload: string, includeId: boolean = true): BuiltPacket {
    let data: string;
    let returnedId: string | undefined = undefined;

    if (includeId) {
      const generatedId = this.generateId();
      data = `${generatedId},${payload}`;
      returnedId = generatedId;
    } else {
      data = payload;
    }

    const length = this.calculateByteLength(data);
    const content = `${header},${length},${data},`;
    const checksum = this.calculateChecksum(content);
    
    return {
      raw: `$${content}*${checksum}\r\n`,
      ...(returnedId !== undefined && { id: returnedId })
    };
  }

  private static generateId(): string {
    if (this.nextId >= 9999) this.nextId = 0;
    return `${this.CLIENT_ID}${this.nextId++}`;
  }

  private static calculateByteLength(str: string): number {
    return Buffer.byteLength(str, 'utf8');
  }

  private static calculateChecksum(data: string): string {
    const buffer = Buffer.from(data, 'utf8');
    let checksum = 0;
    for (let i = 0; i < buffer.length; i++) {
      checksum ^= buffer[i];
    }
    return checksum.toString(16).toUpperCase().padStart(2, '0');
  }
}