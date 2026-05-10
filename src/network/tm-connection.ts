// src/network/TMConnection.ts

import { Socket } from 'node:net';
import { EventEmitter } from 'node:events';
import { ParserRouter } from '../protocol/parsers/packet-parser.js';
import { BuiltPacket, ParsedSpecificPacket, TMHeader } from '../types/index.js';
import { TMConnectError, TMParseError, TMProtocolError, TMSCTError } from '../errors/techman-errors.js';

export class TMConnection extends EventEmitter {
  private socket: Socket;
  private buffer: string = '';

  private pendingRequests = new Map<string, {
    resolve: (packet: ParsedSpecificPacket) => void, 
    reject: (err: Error) => void,
    timer: NodeJS.Timeout
  }>();

  private reconnectTimer: NodeJS.Timeout | null = null;
  private isExplicitlyClosed: boolean = false;

  constructor(private host: string, private port: number, private autoReconnect: boolean = true) {
    super();
    this.socket = new Socket();
    this.setupListeners();
  }

  private setupListeners() {
    this.socket.on('data', (chunk) => {
      this.buffer += chunk.toString('utf8');
      this.processBuffer();
    });

    this.socket.on('error', (err) => {
      this.emit('error', err);
    });

    this.socket.on('close', () => {
      this.emit('disconnected');

      this.cleanupPendingRequests(new Error('Connection closed'));

      if (this.autoReconnect && !this.isExplicitlyClosed) {
        this.scheduleReconnect();
      }
    });
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    
    console.log('🔄 Attempting to reconnect in 3 seconds...');
    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      try {
        await this.connect();
      } catch (e) { }
    }, 3000);
  } // Naxui?

  private cleanupPendingRequests(err: Error) {
    for (const [_, req] of this.pendingRequests) {
      clearTimeout(req.timer);
      req.reject(err);
    }
    this.pendingRequests.clear();
  }

  async connect(): Promise<void> {
    this.isExplicitlyClosed = false;
    return new Promise((resolve, reject) => {
      this.socket.removeAllListeners('connect');
      
      this.socket.connect(this.port, this.host, () => {
        console.log('✅ Connected!');
        this.emit('connected');
        resolve();
      });

      this.socket.once('error', (err) => {
        reject(new TMConnectError(err.message));
      });
    });
  }

  disconnect() {
    this.isExplicitlyClosed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.socket.destroy();
  }

  send(data: string) {
    if (!this.socket.writable) throw new TMConnectError('Socket not writable: connection might be lost');
    this.socket.write(data);
  }

  private processBuffer() {
    while (true) {
      const startIdx = this.buffer.indexOf('$');
      if (startIdx === -1) break;

      if (startIdx > 0) {
        this.buffer = this.buffer.substring(startIdx);
      }

      const starIdx = this.buffer.indexOf('*');
      if (starIdx === -1) break;

      const expectedEndIdx = starIdx + 5;

      if (this.buffer.length < expectedEndIdx) {
        break;
      }

      const rawPacket = this.buffer.substring(0, expectedEndIdx);

      if (!rawPacket.endsWith('\r\n')) {
        this.buffer = this.buffer.substring(1);
        continue;
      }

      try {
        const parsed = ParserRouter.routeAndParse(rawPacket);
        this.handleIncomingPacket(parsed);
      } catch (e) {
        if (e instanceof Error) {
          this.emit('error', e);
        } else {
          this.emit('error', new TMParseError(String(e)));
        }
      }

      this.buffer = this.buffer.substring(expectedEndIdx);
    }
  }

  async sendCommand<T extends ParsedSpecificPacket>(
    packet: BuiltPacket, 
    timeoutMs: number = 5000
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const requestId = packet.id || `QUEUE_${Date.now()}`;

      const timer = setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new TMConnectError(`Timeout: Robot did not respond to ${packet.id || 'request'}`));
        }
      }, timeoutMs);

      this.pendingRequests.set(requestId, { 
        resolve: resolve as any, 
        reject, 
        timer 
      });

      try {
        this.send(packet.raw);
      } catch (err) {
        clearTimeout(timer);
        this.pendingRequests.delete(requestId);
        reject(err);
      }
    });
  }

  private handleIncomingPacket(parsed: any) {
    let targetRequest: any = null;
    let targetKey: string | null = null;

    if (parsed.id && this.pendingRequests.has(parsed.id)) {
      targetKey = parsed.id;
      targetRequest = this.pendingRequests.get(parsed.id);
    }
    else if (!parsed.id && this.port === 5890) {
      const firstEntry = this.pendingRequests.entries().next().value;
      if (firstEntry) {
        [targetKey, targetRequest] = firstEntry;
      }
    }

    if (parsed.header === TMHeader.Error) {
      const firstEntry = this.pendingRequests.entries().next().value;
      if (firstEntry) {
        const [key, req] = firstEntry;
        clearTimeout(req.timer);
        this.pendingRequests.delete(key);
        req.reject(new TMProtocolError(TMHeader.Error, parsed.message));
      }
      this.emit('error', new TMProtocolError(TMHeader.Error, parsed.message));
      return;
    }

    if (targetRequest && targetKey) {
      clearTimeout(targetRequest.timer);
      this.pendingRequests.delete(targetKey);

      if (parsed.header === TMHeader.Script && parsed.status === TMHeader.Error) {
        targetRequest.reject(new TMSCTError(`Robot rejected script`, parsed.ERRORLines));
      } else {
        targetRequest.resolve(parsed);
      }
    }

    this.emit('packet', parsed);
  }

  async execute<T extends ParsedSpecificPacket>(
    packet: BuiltPacket, 
    wait: boolean = true, 
    timeoutMs: number = 5000
  ): Promise<T | void> {
    if (wait) {
      return await this.sendCommand<T>(packet, timeoutMs);
    } else {
      this.send(packet.raw);
      return; 
    }
  }
}
