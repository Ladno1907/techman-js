// src/protocol/builders/PacketBuilder.ts

import { BuiltPacket, TMHeader } from "../../types/index.js";
import { IPacketBuilder } from "../../types/interfaces.js";


export class PacketBuilder implements IPacketBuilder {
  private readonly CLIENT_ID = 'NodeJS';
  private nextId: number = 0;

  build(header: TMHeader, payload: string): BuiltPacket {
    let data: string;

    const generatedId = this.generateId();
    data = `${generatedId},${payload}`;

    const length = this.calculateByteLength(data);
    const content = `${header},${length},${data},`;
    const checksum = this.calculateChecksum(content);
    
    return {
      raw: `$${content}*${checksum}\r\n`,
      id: generatedId
    };
  }

  private generateId(): string {
    if (this.nextId >= 9999) this.nextId = 0;
    return `${this.CLIENT_ID}${this.nextId++}`;
  }

  private calculateByteLength(str: string): number {
    return Buffer.byteLength(str, 'utf8');
  }

  private calculateChecksum(data: string): string {
    const buffer = Buffer.from(data, 'utf8');
    let checksum = 0;
    for (let i = 0; i < buffer.length; i++) {
      checksum ^= buffer[i];
    }
    return checksum.toString(16).toUpperCase().padStart(2, '0');
  }
}

export class SimplePacketBuilder implements IPacketBuilder {
  build(header: TMHeader, payload: string): BuiltPacket {
    const length = this.calculateByteLength(payload);
    const content = `${header},${length},${payload},`;
    const checksum = this.calculateChecksum(content);
    
    return {
      raw: `$${content}*${checksum}\r\n`
    };
  }

  private calculateByteLength(str: string): number {
    return Buffer.byteLength(str, 'utf8');
  }

  private calculateChecksum(data: string): string {
    const buffer = Buffer.from(data, 'utf8');
    let checksum = 0;
    for (let i = 0; i < buffer.length; i++) {
      checksum ^= buffer[i];
    }
    return checksum.toString(16).toUpperCase().padStart(2, '0');
  }
}