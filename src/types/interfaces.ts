import { TMTagNumber, ParsedSpecificPacket, BuiltPacket } from './index.js';
import { EventEmitter } from 'node:events';

export interface IPacketBuilder {
  build(header: string, payload: string): BuiltPacket;
}

export interface IPacketParser {
  parse(raw: string): { header: string; content: string; parts: string[] };
}

export interface IParserRouter {
  routeAndParse(raw: string): ParsedSpecificPacket;
}

export interface PendingRequest {
  resolve: (data: any) => void;
  reject: (err: Error) => void;
  timer: NodeJS.Timeout;
}

export interface IConnection extends EventEmitter {
  connect(): Promise<void>;
  disconnect(): void;
  execute<T extends ParsedSpecificPacket>(
    packet: BuiltPacket, 
    wait?: boolean, 
    timeout?: number
  ): Promise<T | void>;
}

export interface ISpecificParser {
  parse(raw: string): ParsedSpecificPacket;
}



export interface ISystemCommands {
  ScriptExit(): BuiltPacket;
  StopAndClearBuffer(): BuiltPacket;
  Pause(): BuiltPacket;
  Resume(): BuiltPacket;
  QueueTag(tagId: number, waitForCompletion?: boolean): BuiltPacket;
  WaitQueueTag(tagId: number, timeoutMs?: number): BuiltPacket;
}

export interface IConfigurationCommands {
  ChangeBase(base: string | number[]): BuiltPacket;
  ChangeTCP(target: string | number[], weight?: number, inertia?: number[]): BuiltPacket;
  ChangeLoad(weight: number): BuiltPacket;
}

export interface IMotionCommands {
  PTP(
    target: number[], 
    format: 'JPP' | 'CPP', 
    speed?: number, 
    accelMs?: number, 
    blend?: number, 
    usePrecisePositioning?: boolean
  ): BuiltPacket;

  Line(
    target: number[], 
    format: 'CAR' | 'CAP' | 'CPR' | 'CPP', 
    speed?: number, 
    accelMs?: number, 
    blend?: number, 
    usePrecisePositioning?: boolean
  ): BuiltPacket;

  Circle(
    viaPoint: number[], 
    endPoint: number[], 
    format: 'CAP' | 'CPP', 
    speed?: number, 
    accelMs?: number, 
    blendPercent?: number, 
    arcAngle?: number, 
    usePrecisePositioning?: boolean
  ): BuiltPacket;

  PLine(
    target: number[], 
    format: 'JAP' | 'CAP', 
    speedVelocity?: number, 
    accelMs?: number, 
    blendPercent?: number
  ): BuiltPacket;

  Move_PTP(
    offset: number[], 
    format: 'CPP' | 'TPP' | 'JPP', 
    speed?: number, 
    accelMs?: number, 
    blendPercent?: number, 
    usePrecisePositioning?: boolean
  ): BuiltPacket;

  Move_Line(
    offset: number[], 
    format: 'TAR' | 'TAP' | 'TPP' | 'TPR' | 'CAR' | 'CAP' | 'CPP' | 'CPR', 
    speed?: number, 
    accelMs?: number, 
    blend?: number, 
    usePrecisePositioning?: boolean
  ): BuiltPacket;

  Move_PLine(
    offset: number[], 
    format: 'CAP' | 'TAP' | 'JAP', 
    speedVelocity?: number, 
    accelMs?: number, 
    blendPercent?: number
  ): BuiltPacket;
}

export interface ITMSCTBuilder {
  readonly system: ISystemCommands;
  readonly config: IConfigurationCommands;
  readonly motion: IMotionCommands;
}

export interface ITMSTABuilder {
  /** Проверка входа в проект (Project Entry) */
  buildStatusEntry(): BuiltPacket;
  /** Проверка статуса конкретного тега */
  buildTagStatus(tagNumber: TMTagNumber): BuiltPacket;
}

/**
 * Контракт для работы с переменными и данными (TMSVR)
 */
export interface ITMSVRBuilder {
  /** Запрос на запись данных */
  buildWriteRequest(dataItems: string[]): BuiltPacket;
  /** Запрос на чтение данных */
  buildReadRequest(itemNames: string[]): BuiltPacket;
}