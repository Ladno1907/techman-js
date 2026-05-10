// src/network/TMScriptConnection.ts

import { TMConnection } from './tm-connection.js';
import { ParsedTMSCT, ParsedTMSTA, TMTagNumber } from '../types/index.js';

import { TMSTABuilder } from '../protocol/builders/TMSTABuilder.js';
import { TMSCTBuilder } from '../protocol/builders/TMSCTBuilder.js';

/**
 * Канал управления роботом (Порт 5890)
 */
export class TMScriptConnection extends TMConnection {
  constructor(host: string, autoReconnect: boolean = true) {
    super(host, 5890, autoReconnect);
  }

  async scriptExit(wait: boolean = true): Promise<ParsedTMSCT | void> {
    const packet = TMSCTBuilder.ScriptExit();
    return await this.execute<ParsedTMSCT>(packet, wait);
  }

  async setQueueTag(tagId: number, waitForCompletion: boolean = false, wait: boolean = true): Promise<ParsedTMSCT | void> {
    const packet = TMSCTBuilder.QueueTag(tagId, waitForCompletion);
    return await this.execute<ParsedTMSCT>(packet, wait);
  }

  async waitQueueTag(tagId: number, timeoutMs: number = -1, wait: boolean = true): Promise<ParsedTMSCT | void> {
    const packet = TMSCTBuilder.WaitQueueTag(tagId, timeoutMs);
    return await this.execute<ParsedTMSCT>(packet, wait);
  }

  async stopAndClear(wait: boolean = true): Promise<ParsedTMSCT | void> {
    const packet = TMSCTBuilder.StopAndClearBuffer();
    return await this.execute<ParsedTMSCT>(packet, wait);
  }

  async pause(wait: boolean = true): Promise<ParsedTMSCT | void> {
    const packet = TMSCTBuilder.Pause();
    return await this.execute<ParsedTMSCT>(packet, wait);
  }

  async resume(wait: boolean = true): Promise<ParsedTMSCT | void> {
    const packet = TMSCTBuilder.Resume();
    return await this.execute<ParsedTMSCT>(packet, wait);
  }

  async ptp(
    target: number[],
    isJoint: boolean = false,
    speed: number = 5,
    accelMs: number = 200,
    blend: number = 0,
    wait: boolean = true
  ): Promise<ParsedTMSCT | void> {
    const packet = TMSCTBuilder.PTP(
      target, 
      isJoint,
      speed, 
      accelMs, 
      blend
    );
    return await this.execute<ParsedTMSCT>(packet, wait);
  }

  async line(
    target: number[],
    isAbsoluteSpeed: boolean = false,
    isRadiusBlending: boolean = false,
    speed: number = 5,
    accelMs: number = 200,
    blend: number = 0,
    wait: boolean = true
  ): Promise<ParsedTMSCT | void> {
    const packet = TMSCTBuilder.Line(
      target,
      isAbsoluteSpeed,
      isRadiusBlending,
      speed,
      accelMs,
      blend
    );
    return await this.execute<ParsedTMSCT>(packet, wait);
  }

  async circle(
    viaPoint: number[],
    endPoint: number[],
    isAbsoluteSpeed: boolean = false,
    speed: number = 10,
    accelMs: number = 200,
    blendPercent: number = 0,
    arcAngle: number = 0,
    wait: boolean = true
  ): Promise<ParsedTMSCT | void> {
    const packet = TMSCTBuilder.Circle(
      viaPoint,
      endPoint,
      isAbsoluteSpeed,
      speed,
      accelMs,
      blendPercent,
      arcAngle
    );
    return await this.execute<ParsedTMSCT>(packet, wait);
  }

  async pLine(
    target: number[],
    isJoint: boolean = false,
    speed: number = 100,
    accelMs: number = 200,
    blendPercent: number = 0,
    wait: boolean = true
  ): Promise<ParsedTMSCT | void> {
    const packet = TMSCTBuilder.PLine(
      target,
      isJoint,
      speed,
      accelMs,
      blendPercent
    );
    return await this.execute<ParsedTMSCT>(packet, wait);
  }

  async movePTP(
    offset: number[],
    targetType: 'C' | 'T' | 'J' = 'J',
    speed: number = 5,
    accelMs: number = 200,
    blendPercent: number = 0,
    wait: boolean = true
  ): Promise<ParsedTMSCT | void> {
    const packet = TMSCTBuilder.Move_PTP(
      offset,
      targetType,
      speed,
      accelMs,
      blendPercent
    );
    return await this.execute<ParsedTMSCT>(packet, wait);
  }

  async moveLine(
    offset: number[],
    isTool: boolean = false,
    isAbsoluteSpeed: boolean = false,
    isRadiusBlending: boolean = false,
    speed: number = 10,
    accelMs: number = 200,
    blend: number = 0,
    wait: boolean = true
  ): Promise<ParsedTMSCT | void> {
    const packet = TMSCTBuilder.Move_Line(
      offset, 
      isTool, 
      isAbsoluteSpeed, 
      isRadiusBlending, 
      speed, 
      accelMs, 
      blend
    );

    return await this.execute<ParsedTMSCT>(packet, wait);
  }

  async movePLine(
    offset: number[],
    targetType: 'C' | 'T' | 'J' = 'C',
    speed: number = 100,
    accelMs: number = 200,
    blendPercent: number = 0,
    wait: boolean = true
  ): Promise<ParsedTMSCT | void> {
    const packet = TMSCTBuilder.Move_PLine(
      offset,
      targetType,
      speed,
      accelMs,
      blendPercent
    );
    return await this.execute<ParsedTMSCT>(packet, wait);
  }

  async changeTCP(
    target: string | number[], 
    weight?: number, 
    inertia?: number[], 
    wait: boolean = true
  ): Promise<ParsedTMSCT | void> {
    const packet = TMSCTBuilder.ChangeTCP(target, weight, inertia);
    return await this.execute<ParsedTMSCT>(packet, wait);
  }

  async changeBase(base: string | number[], wait: boolean = true): Promise<ParsedTMSCT | void> {
    const packet = TMSCTBuilder.ChangeBase(base);
    return await this.execute<ParsedTMSCT>(packet, wait);
  }

  async setPayload(weight: number, wait: boolean = true): Promise<ParsedTMSCT | void> {
    const packet = TMSCTBuilder.ChangePayload(weight);
    return await this.execute<ParsedTMSCT>(packet, wait);
  }



  async checkProjectEntry(): Promise<ParsedTMSTA | void> {
    const packet = TMSTABuilder.buildStatusEntry();
    return await this.sendCommand<ParsedTMSTA>(packet);
  }

  async checkTagStatus(tagNumber: TMTagNumber): Promise<ParsedTMSTA> {
    const packet = TMSTABuilder.buildTagStatus(tagNumber);
    return await this.sendCommand<ParsedTMSTA>(packet) as ParsedTMSTA;
  }
}
