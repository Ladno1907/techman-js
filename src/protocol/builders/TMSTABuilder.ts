// src/protocol/builders/TMSTABuilder.ts

import { TMHeader, BuiltPacket, TMTagNumber, TM_TAGS, IPacketBuilder } from "../../types/index.js";
import { TMSTAError } from "../../errors/techman-errors.js";
import { SimplePacketBuilder } from "./packet-builder.js";

export class TMSTABuilder {
  private builder: IPacketBuilder;
  private header: TMHeader = TMHeader.Status;

  constructor(packetBuilder: IPacketBuilder = new SimplePacketBuilder()) {
    this.builder = packetBuilder;
  }

  buildStatusEntry(): BuiltPacket {
    const payload = '00';
    return this.builder.build(this.header, payload);
  }

  buildTagStatus(tagNumber: TMTagNumber): BuiltPacket {
    if (!(TM_TAGS as readonly string[]).includes(tagNumber)) throw new TMSTAError(`Invalid tag number: "${tagNumber}". Expected values from '01' to '15'.`);
    const payload = `01,${tagNumber}`;
    return this.builder.build(this.header, payload);
  }
}