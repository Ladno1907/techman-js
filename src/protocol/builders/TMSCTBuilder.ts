// src/protocol/builders/TMSCTBuilder.ts

import { TMHeader, BuiltPacket, IPacketBuilder } from "../../types/index.js";
import { TMSCTError } from "../../errors/techman-errors.js";
import { PacketBuilder } from "./packet-builder.js";

export class TMSCTBuilder {
  public readonly system: SystemCommands;
  public readonly config: ConfigurationCommands;
  public readonly motion: MotionCommands;

  constructor(packetBuilder: IPacketBuilder = new PacketBuilder()) {
    this.system = new SystemCommands(packetBuilder);
    this.config = new ConfigurationCommands(packetBuilder);
    this.motion = new MotionCommands(packetBuilder);
  }
}

export class SystemCommands {
  private builder: IPacketBuilder;
  private header: TMHeader = TMHeader.Script;

  constructor(packetBuilder: IPacketBuilder = new PacketBuilder()) {
    this.builder = packetBuilder;
  }

  ScriptExit() {
    return this.builder.build(this.header, 'ScroptExit()');
  }

  StopAndClearBuffer() {
    return this.builder.build(this.header, 'StopAndClearBuffer()');
  }

  Pause() {
    return this.builder.build(this.header, 'Pause()');
  }

  Resume() {
    return this.builder.build(this.header, 'Resume()');
  }

  QueueTag(
    tagId: number,
    waitForCompletion: boolean = false
  ): BuiltPacket {
    if (tagId < 1 || tagId > 15) throw new TMSCTError(`Invalid QueueTag ID: ${tagId}. Must be 1-15`);
    const command = `QueueTag(${tagId},${waitForCompletion ? '1' : '0'})`;
    return this.builder.build(this.header, command);
  }

  WaitQueueTag(
    tagId: number,
    timeoutMs: number = -1
  ): BuiltPacket {
    if (tagId < 1 || tagId > 15) throw new TMSCTError(`Invalid WaitQueueTag ID: ${tagId}. Must be 1-15`);
    const command = `WaitQueueTag(${tagId},${timeoutMs})`;
    return this.builder.build(this.header, command);
  }
}

export class ConfigurationCommands {
  private builder: IPacketBuilder;
  private header: TMHeader = TMHeader.Script;

  constructor(packetBuilder: IPacketBuilder = new PacketBuilder()) {
    this.builder = packetBuilder;
  }

  ChangeBase(base: string | number[]): BuiltPacket {
    let command: string;

    if (typeof base === 'string') {
      command = `ChangeBase("${base}")`;
    } else {
      if (base.length !== 6) {
        throw new TMSCTError('ChangeBase coordinates must contain 6 values');
      }
      command = `ChangeBase(${base.join(',')})`;
    }

    return this.builder.build(this.header, command);
  }

  ChangeTCP(target: string | number[], weight?: number, inertia?: number[]): BuiltPacket {
    let command: string;

    if (typeof target === 'string') {
      command = `ChangeTCP("${target}")`;
    } else {
      if (target.length !== 6) throw new TMSCTError('TCP coordinates must contain 6 values');

      if (weight !== undefined && inertia !== undefined) {
        if (inertia.length !== 9) throw new TMSCTError('Inertia array must contain 9 values');
        command = `ChangeTCP(${target.join(',')},${weight},${inertia.join(',')})`;
      } 
      else if (weight !== undefined) {
        command = `ChangeTCP(${target.join(',')},${weight})`;
      } 
      else {
        command = `ChangeTCP(${target.join(',')})`;
      }
    }

    return this.builder.build(this.header, command);
  }

  ChangeLoad(weight: number): BuiltPacket {
    if (weight < 0) {
      throw new TMSCTError('Payload weight cannot be negative');
    }
    const command = `ChangeLoad(${weight})`;
    return this.builder.build(this.header, command);
  }
}

export class MotionCommands {
  private builder: IPacketBuilder;
  private header: TMHeader = TMHeader.Script;

  constructor(packetBuilder: IPacketBuilder = new PacketBuilder()) {
    this.builder = packetBuilder;
  }

  PTP(
    target: number[],
    format: 'JPP' | 'CPP',
    speed: number = 5,
    accelMs: number = 200,
    blend: number = 0,
    usePrecisePositioning: boolean = false
  ): BuiltPacket {
    if (target.length !== 6) throw new TMSCTError(`PTP requires 6 values, got ${target.length}`);

    const targetStr = target.join(',');
    const command = `PTP("${format}",${targetStr},${speed},${accelMs},${blend},${usePrecisePositioning})`;

    return this.builder.build(this.header, command);
  }

  Line(
    target: number[],
    format: 'CAR' | 'CAP' | 'CPR' | 'CPP',
    speed: number = 5,
    accelMs: number = 200,
    blend: number = 0,
    usePrecisePositioning: boolean = false
  ): BuiltPacket {
    if (target.length !== 6) throw new TMSCTError('Line requires 6 coordinates');

    const targetStr = target.join(',');
    const command = `Line("${format}",${targetStr},${speed},${accelMs},${blend},${usePrecisePositioning})`;
    
    return this.builder.build(this.header, command);
  }

  Circle(
    viaPoint: number[],
    endPoint: number[],
    format: 'CAP' | 'CPP',
    speed: number = 10,
    accelMs: number = 200,
    blendPercent: number = 0,
    arcAngle: number = 0,
    usePrecisePositioning: boolean = false
  ): BuiltPacket {
    if (viaPoint.length !== 6 || endPoint.length !== 6) throw new TMSCTError('Circle requires 6 coordinates for both viaPoint and endPoint');

    const viaStr = viaPoint.join(',');
    const endStr = endPoint.join(',');

    const command = `Circle("${format}",${viaStr},${endStr},${speed},${accelMs},${blendPercent},${arcAngle},${usePrecisePositioning})`;
    
    return this.builder.build(this.header, command);
  }

  PLine(
    target: number[],
    format: 'JAP' | 'CAP',
    speedVelocity: number = 100,
    accelMs: number = 200,
    blendPercent: number = 0
  ): BuiltPacket {
    if (target.length !== 6) throw new TMSCTError('PLine requires 6 target values');

    const targetStr = target.join(',');
    const command = `PLine("${format}",${targetStr},${speedVelocity},${accelMs},${blendPercent})`;
    
    return this.builder.build(this.header, command);
  }

  Move_PTP(
    offset: number[],
    format: 'CPP' | 'TPP' | 'JPP',
    speed: number = 5,
    accelMs: number = 200,
    blendPercent: number = 0,
    usePrecisePositioning: boolean = false
  ): BuiltPacket {
    if (offset.length !== 6) throw new TMSCTError('Move_PTP requires 6 offset values');

    const offsetStr = offset.join(',');
    const command = `Move_PTP("${format}",${offsetStr},${speed},${accelMs},${blendPercent},${usePrecisePositioning})`;
    
    return this.builder.build(this.header, command);
  }

  Move_Line(
    offset: number[],
    format: 'TAR' | 'TAP' | 'TPP' | 'TPR' | 'CAR' | 'CAP' | 'CPP' | 'CPR',
    speed: number = 5,
    accelMs: number = 200,
    blend: number = 0,
    usePrecisePositioning: boolean = false
  ): BuiltPacket {
    if (offset.length !== 6) throw new TMSCTError('Move_Line requires 6 offset values');

    const offsetStr = offset.join(',');
    const command = `Move_Line("${format}",${offsetStr},${speed},${accelMs},${blend},${usePrecisePositioning})`;

    return this.builder.build(this.header, command);
  }

  Move_PLine(
    offset: number[],
    format: 'CAP' | 'TAP' | 'JAP',
    speedVelocity: number = 100,
    accelMs: number = 200,
    blendPercent: number = 0
  ): BuiltPacket {
    if (offset.length !== 6) throw new TMSCTError('Move_PLine requires 6 offset values');

    const offsetStr = offset.join(',');

    const command = `Move_PLine("${format}",${offsetStr},${speedVelocity},${accelMs},${blendPercent})`;
    return this.builder.build(this.header, command);
  }
}