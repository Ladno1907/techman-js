// src/network/clients/TMScriptClient.ts

import { IConnection, ParsedTMSCT, ParsedTMSTA, TMTagNumber } from '../types/index.js';
import { 
  ISystemCommands, 
  IConfigurationCommands, 
  IMotionCommands, 
  ITMSTABuilder 
} from '../types/index.js';
import { TMSCTBuilder } from '../protocol/builders/TMSCTBuilder.js';
import { TMSTABuilder } from '../protocol/builders/TMSTABuilder.js';

export class TMScriptClient {
  constructor(
    private connection: IConnection,
    private system: ISystemCommands = new TMSCTBuilder().system,
    private config: IConfigurationCommands = new TMSCTBuilder().config,
    private motion: IMotionCommands = new TMSCTBuilder().motion,
    private status: ITMSTABuilder = new TMSTABuilder()
  ) {}

  // --- System Commands ---
  async scriptExit(wait = true) {
    return this.connection.execute<ParsedTMSCT>(this.system.ScriptExit(), wait);
  }

  async setQueueTag(tagId: number, waitForCompletion = false, wait = true) {
    return this.connection.execute<ParsedTMSCT>(this.system.QueueTag(tagId, waitForCompletion), wait);
  }

  async waitQueueTag(tagId: number, timeoutMs = -1, wait = true) {
    return this.connection.execute<ParsedTMSCT>(this.system.WaitQueueTag(tagId, timeoutMs), wait);
  }

  async stopAndClear(wait = true) {
    return this.connection.execute<ParsedTMSCT>(this.system.StopAndClearBuffer(), wait);
  }

  async pause(wait = true) {
    return this.connection.execute<ParsedTMSCT>(this.system.Pause(), wait);
  }

  async resume(wait = true) {
    return this.connection.execute<ParsedTMSCT>(this.system.Resume(), wait);
  }

  // --- Motion Commands ---
  async ptp(target: number[], format: 'JPP' | 'CPP', speed = 5, accelMs = 200, blend = 0, wait = true) {
    const packet = this.motion.PTP(target, format, speed, accelMs, blend);
    return this.connection.execute<ParsedTMSCT>(packet, wait);
  }

  async line(target: number[], format: 'CAR' | 'CAP' | 'CPR' | 'CPP', speed = 5, accelMs = 200, blend = 0, wait = true) {
    const packet = this.motion.Line(target, format, speed, accelMs, blend);
    return this.connection.execute<ParsedTMSCT>(packet, wait);
  }

  async circle(viaPoint: number[], endPoint: number[], format: 'CAP' | 'CPP', speed: number = 10, accelMs: number = 200, blendPercent: number = 0, arcAngle: number = 0, wait: boolean = true): Promise<ParsedTMSCT | void> {
    const packet = this.motion.Circle(viaPoint, endPoint, format, speed, accelMs, blendPercent, arcAngle);
    return await this.connection.execute<ParsedTMSCT>(packet, wait);
  }

  async pLine(target: number[], format: 'JAP' | 'CAP', speed: number = 100, accelMs: number = 200, blendPercent: number = 0, wait: boolean = true): Promise<ParsedTMSCT | void> {
    const packet = this.motion.PLine(target, format, speed, accelMs, blendPercent);
    return await this.connection.execute<ParsedTMSCT>(packet, wait);
  }

  async movePTP(offset: number[], format: 'CPP' | 'TPP' | 'JPP', speed: number = 5, accelMs: number = 200, blendPercent: number = 0, wait: boolean = true): Promise<ParsedTMSCT | void> {
    const packet = this.motion.Move_PTP(offset, format, speed, accelMs, blendPercent);
    return await this.connection.execute<ParsedTMSCT>(packet, wait);
  }

  async moveLine(offset: number[], format: 'TAR' | 'TAP' | 'TPP' | 'TPR' | 'CAR' | 'CAP' | 'CPP' | 'CPR', speed: number = 10, accelMs: number = 200, blend: number = 0, wait: boolean = true): Promise<ParsedTMSCT | void> {
    const packet = this.motion.Move_Line(offset, format, speed, accelMs, blend);
    return await this.connection.execute<ParsedTMSCT>(packet, wait);
  }

  async movePLine(offset: number[], format: 'CAP' | 'TAP' | 'JAP', speed: number = 100, accelMs: number = 200, blendPercent: number = 0, wait: boolean = true): Promise<ParsedTMSCT | void> {
    const packet = this.motion.Move_PLine(offset, format, speed, accelMs, blendPercent);
    return await this.connection.execute<ParsedTMSCT>(packet, wait);
  }

  // --- Configuration Commands ---
  async changeTCP(target: string | number[], weight?: number, inertia?: number[], wait = true) {
    const packet = this.config.ChangeTCP(target, weight, inertia);
    return this.connection.execute<ParsedTMSCT>(packet, wait);
  }

  async changeBase(base: string | number[], wait = true) {
    const packet = this.config.ChangeBase(base);
    return this.connection.execute<ParsedTMSCT>(packet, wait);
  }

  async changeLoad(weight: number, wait = true) {
    const packet = this.config.ChangeLoad(weight);
    return this.connection.execute<ParsedTMSCT>(packet, wait);
  }

  // --- Status Commands ---
  async checkProjectEntry(): Promise<ParsedTMSTA | void> {
    const packet = this.status.buildStatusEntry();
    return this.connection.execute<ParsedTMSTA>(packet, true);
  }

  async checkTagStatus(tagNumber: TMTagNumber): Promise<ParsedTMSTA> {
    const packet = this.status.buildTagStatus(tagNumber);
    return await this.connection.execute<ParsedTMSTA>(packet, true) as ParsedTMSTA;
  }
}