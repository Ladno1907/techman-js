// src/protocol/builders/TMSVRBuilder.ts

import { TMHeader, BuiltPacket, IPacketBuilder } from "../../types/index.js";
import { TMSVRError } from "../../errors/techman-errors.js";
import { PacketBuilder } from "./packet-builder.js";

export class TMSVRBuilder {
  private builder: IPacketBuilder;
  private header: TMHeader = TMHeader.Value;

  constructor(packetBuilder: IPacketBuilder = new PacketBuilder()) {
    this.builder = packetBuilder;
  }

  buildWriteRequest(dataItems: string[]): BuiltPacket {
    if (!dataItems || dataItems.length === 0) throw new TMSVRError('Write request must contain at least one data item', 'LocalValidation');
    const itemsString = dataItems.join('\r\n');
    const payload = `2,${itemsString}`; 
    return this.builder.build(this.header, payload);
  }

  buildReadRequest(itemNames: string[]): BuiltPacket {
    if (!itemNames || itemNames.length === 0) throw new TMSVRError('Read request must contain at least one item name', 'LocalValidation');
    const itemsString = itemNames.join('\r\n');
    const payload = `12,${itemsString}`;
    return this.builder.build(this.header, payload);
  }
}