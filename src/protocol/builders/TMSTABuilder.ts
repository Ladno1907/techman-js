// src/protocol/builders/TMSTABuilder.ts

import { TMHeader, BuiltPacket, TMTagNumber, TM_TAGS } from "../../types/index.js";
import { TMSTAError } from "../../errors/techman-errors.js";
import { PacketBuilder } from "./packet-builder.js";

export class TMSTABuilder extends PacketBuilder {
  static buildStatusEntry(): BuiltPacket {
    const payload = '00';
    return super.build(TMHeader.Status, payload, false);
  }

  static buildTagStatus(tagNumber: TMTagNumber): BuiltPacket {
    if (!(TM_TAGS as readonly string[]).includes(tagNumber)) throw new TMSTAError(`Invalid tag number: "${tagNumber}". Expected values from '01' to '15'.`);
    const payload = `01,${tagNumber}`;
    return super.build(TMHeader.Status, payload, false);
  }
} // Good