import { TMHeader } from '../types/index.js';

export class TechmanError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, TechmanError.prototype);
  }
}

export class TMConnectError extends TechmanError {
  constructor(message: string) {
    super(`TMConnectError: ${message}`);
  }
}

export class TMParseError extends TechmanError {
  constructor(message: string) {
    super(`TMParseError: ${message}`);
  }
}

export class TMProtocolError extends TechmanError {
  constructor(public header: string, message: string) {
    super(`${header} Error: ${message}`);
  }
}

export class TMSTAError extends TMProtocolError {
  constructor(message: string, public tagNumber?: string) {
    super(TMHeader.Status, message);
  }
}

export class TMSCTError extends TMProtocolError {
  constructor(message: string, public lines?: number[]) {
    super(TMHeader.Script, message);
  }
}

export class TMSVRError extends TMProtocolError {
  constructor(message: string, public status: string) {
    super(TMHeader.Value, message);
  }
}
