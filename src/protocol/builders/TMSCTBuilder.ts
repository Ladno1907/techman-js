// src/protocol/builders/TMSCTBuilder.ts

import { TMHeader, BuiltPacket } from "../../types/index.js";
import { TMSCTError } from "../../errors/techman-errors.js";
import { PacketBuilder } from "./packet-builder.js";

export class TMSCTBuilder extends PacketBuilder {
  private static buildScript(commands: string | string[]): BuiltPacket {
    const script = Array.isArray(commands) ? commands.join('\r\n') : commands;
    if (!script.trim()) throw new TMSCTError('Script content cannot be empty');

    return super.build(TMHeader.Script, script);
  }

  static ScriptExit() {
    return this.buildScript('ScroptExit()')
  }

  static QueueTag(
    tagId: number,
    waitForCompletion: boolean = false
  ): BuiltPacket {
    if (tagId < 1 || tagId > 15) throw new TMSCTError(`Invalid QueueTag ID: ${tagId}. Must be 1-15`);

    const command = `QueueTag(${tagId},${waitForCompletion ? '1' : '0'})`;
    return this.buildScript(command);
  }

  static WaitQueueTag(
    tagId: number,
    timeoutMs: number = -1
  ): BuiltPacket {
    if (tagId < 1 || tagId > 15) throw new TMSCTError(`Invalid WaitQueueTag ID: ${tagId}. Must be 1-15`);

    const command = `WaitQueueTag(${tagId},${timeoutMs})`;
    return this.buildScript(command);
  }

  static StopAndClearBuffer() {
    return this.buildScript('StopAndClearBuffer()');
  }

  static Pause() {
    return this.buildScript('Pause()');
  }

  static Resume() {
    return this.buildScript('Resume()');
  }

  /**
   * Универсальное движение Point-to-Point (PTP)
   * @param target Массив из 6 значений (углы суставов или координаты XYZRxRyRz)
   * @param isJoint true - углы суставов (J), false - декартовы координаты (C)
   */
  static PTP(
    target: number[],
    isJoint: boolean = false,
    speed: number = 5,
    accelMs: number = 200,
    blend: number = 0,
    usePrecisePositioning: boolean = false
  ): BuiltPacket {
    if (target.length !== 6) throw new TMSCTError(`PTP requires 6 values, got ${target.length}`);

    const f1 = isJoint ? 'J' : 'C';
    const format = `${f1}PP`;

    const targetStr = target.join(',');
    const command = `PTP("${format}",${targetStr},${speed},${accelMs},${blend},${usePrecisePositioning})`;

    return this.buildScript(command);
  }

  /**
   * Универсальное линейное движение (Line)
   * @param target Координаты [X, Y, Z, Rx, Ry, Rz]
   * @param isAbsoluteSpeed true - мм/с (A), false - % (P)
   * @param isRadiusBlending true - мм (R), false - % (P)
   */
  static Line(
    target: number[],
    isAbsoluteSpeed: boolean = false,
    isRadiusBlending: boolean = false,
    speed: number = 5,
    accelMs: number = 200,
    blend: number = 0,
    usePrecisePositioning: boolean = false
  ): BuiltPacket {
    if (target.length !== 6) throw new TMSCTError('Line requires 6 coordinates');

    const f2 = isAbsoluteSpeed ? 'A' : 'P';
    const f3 = isRadiusBlending ? 'R' : 'P';
    const format = `C${f2}${f3}`;

    const targetStr = target.join(',');
    const command = `Line("${format}",${targetStr},${speed},${accelMs},${blend},${usePrecisePositioning})`;
    
    return this.buildScript(command);
  }
  
  /**
   * Универсальное движение по дуге (Circle)
   * @param viaPoint Промежуточная точка [X, Y, Z, Rx, Ry, Rz]
   * @param endPoint Конечная точка [X, Y, Z, Rx, Ry, Rz]
   * @param isAbsoluteSpeed true - мм/с (A), false - % (P)
   * @param speed Значение скорости
   * @param accelMs Время ускорения (мс)
   * @param blendPercent Процент сглаживания (0-100)
   * @param arcAngle Угол дуги (0 - интерполяция позы, не 0 - сохранение позы)
   */
  static Circle(
    viaPoint: number[],
    endPoint: number[],
    isAbsoluteSpeed: boolean = false,
    speed: number = 10,
    accelMs: number = 200,
    blendPercent: number = 0,
    arcAngle: number = 0,
    usePrecisePositioning: boolean = false
  ): BuiltPacket {
    if (viaPoint.length !== 6 || endPoint.length !== 6) throw new TMSCTError('Circle requires 6 coordinates for both viaPoint and endPoint');

    const f2 = isAbsoluteSpeed ? 'A' : 'P';
    const format = `C${f2}P`;

    const viaStr = viaPoint.join(',');
    const endStr = endPoint.join(',');

    const command = `Circle("${format}",${viaStr},${endStr},${speed},${accelMs},${blendPercent},${arcAngle},${usePrecisePositioning})`;
    
    return this.buildScript(command);
  }

  /**
   * Движение по траектории (PLine)
   * @param target Массив из 6 значений (суставы или координаты)
   * @param isJoint true - суставы (J), false - декартовы координаты (C)
   * @param speedVelocity Скорость СТРОГО в мм/с
   * @param accelMs Время ускорения (мс)
   * @param blendPercent Процент сглаживания (0-100)
   */
  static PLine(
    target: number[],
    isJoint: boolean = false,
    speedVelocity: number = 100,
    accelMs: number = 200,
    blendPercent: number = 0
  ): BuiltPacket {
    if (target.length !== 6) throw new TMSCTError('PLine requires 6 target values');

    const f1 = isJoint ? 'J' : 'C';
    const format = `${f1}AP`;

    const targetStr = target.join(',');
    const command = `PLine("${format}",${targetStr},${speedVelocity},${accelMs},${blendPercent})`;
    
    return this.buildScript(command);
  }

  /**
   * Относительное движение PTP (Move_PTP)
   * @param offset Смещение [6 значений]
   * @param targetType 'C' (база), 'T' (инструмент) или 'J' (суставы)
   * @param speed Процент скорости (1-100)
   * @param accelMs Время ускорения (мс)
   * @param blendPercent Процент сглаживания (0-100)
   */
  static Move_PTP(
    offset: number[],
    targetType: 'C' | 'T' | 'J' = 'J',
    speed: number = 5,
    accelMs: number = 200,
    blendPercent: number = 0,
    usePrecisePositioning: boolean = false
  ): BuiltPacket {
    if (offset.length !== 6) throw new TMSCTError('Move_PTP requires 6 offset values');

    const format = `${targetType}PP`;

    const offsetStr = offset.join(',');
    const command = `Move_PTP("${format}",${offsetStr},${speed},${accelMs},${blendPercent},${usePrecisePositioning})`;
    
    return this.buildScript(command);
  }

  /**
   * Универсальное относительное линейное движение (Move_Line)
   * @param offset Смещение [X, Y, Z, Rx, Ry, Rz]
   * @param isTool Если true - "T" (отн. инструмента), false - "C" (отн. базы)
   * @param isAbsoluteSpeed Если true - "A" (мм/с), false - "P" (%)
   * @param isRadiusBlending Если true - "R" (мм), false - "P" (%)
   */
  static Move_Line(
    offset: number[],
    isTool: boolean = false,
    isAbsoluteSpeed: boolean = false,
    isRadiusBlending: boolean = false,
    speed: number = 5,
    accelMs: number = 200,
    blend: number = 0,
    usePrecisePositioning: boolean = false
  ): BuiltPacket {
    if (offset.length !== 6) throw new TMSCTError('Move_Line requires 6 offset values');

    const f1 = isTool ? 'T' : 'C';
    const f2 = isAbsoluteSpeed ? 'A' : 'P';
    const f3 = isRadiusBlending ? 'R' : 'P';
    const format = `${f1}${f2}${f3}`;

    const offsetStr = offset.join(',');
    const command = `Move_Line("${format}",${offsetStr},${speed},${accelMs},${blend},${usePrecisePositioning})`;

    return this.buildScript(command);
  }

  /**
   * Относительное движение по траектории (Move_PLine)
   * @param offset Смещение [6 значений]
   * @param targetType 'C' (база), 'T' (инструмент) или 'J' (суставы)
   * @param speedVelocity Скорость СТРОГО в мм/с
   * @param accelMs Время ускорения (мс)
   * @param blendPercent Процент сглаживания (0-100)
   */
  static Move_PLine(
    offset: number[],
    targetType: 'C' | 'T' | 'J' = 'C',
    speedVelocity: number = 100,
    accelMs: number = 200,
    blendPercent: number = 0
  ): BuiltPacket {
    if (offset.length !== 6) throw new TMSCTError('Move_PLine requires 6 offset values');

    const format = `${targetType}AP`;
    const offsetStr = offset.join(',');

    const command = `Move_PLine("${format}",${offsetStr},${speedVelocity},${accelMs},${blendPercent})`;
    return this.buildScript(command);
  }

  /**
   * Смена системы координат базы (Base)
   * @param base Название базы (string) или координаты [X, Y, Z, Rx, Ry, Rz] (number[])
   */
  static ChangeBase(base: string | number[]): BuiltPacket {
    let command: string;

    if (typeof base === 'string') {
      command = `ChangeBase("${base}")`;
    } else {
      if (base.length !== 6) {
        throw new TMSCTError('ChangeBase coordinates must contain 6 values');
      }
      command = `ChangeBase(${base.join(',')})`;
    }

    return this.buildScript(command);
  }

  /**
   * Смена инструмента (TCP)
   * @param target Имя TCP (string) или координаты [X, Y, Z, Rx, Ry, Rz] (number[])
   * @param weight Опционально: вес инструмента (кг)
   * @param inertia Опционально: массив инерции и фрейма [Ixx, Iyy, Izz, X, Y, Z, Rx, Ry, Rz] (9 значений)
   */
  static ChangeTCP(target: string | number[], weight?: number, inertia?: number[]): BuiltPacket {
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

    return this.buildScript(command);
  }

  /**
   * Смена веса полезной нагрузки (ChangeLoad)
   * @param weight Вес в кг (float)
   */
  static ChangePayload(weight: number): BuiltPacket {
    if (weight < 0) {
      throw new TMSCTError('Payload weight cannot be negative');
    }
    const command = `ChangeLoad(${weight})`;
    return this.buildScript(command);
  }
} // Good No Ne Vse