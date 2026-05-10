// src/network/TMConnection.ts

import { Socket } from 'node:net';
import { EventEmitter } from 'node:events';
import { IParserRouter, BuiltPacket, ParsedSpecificPacket, IConnection, PendingRequest } from '../types/index.js';
import { TMConnectError, TMProtocolError } from '../errors/techman-errors.js';
import { ParserRouter } from '../protocol/parsers/packet-parser.js';

/**
 * Фреймер пакетов. 
 * Решает проблему "слипшихся" или разорванных пакетов TCP.
 * Собирает сырые байты в полноценные строки протокола TM (от $ до \r\n).
 */
export class PacketFramer {
  private buffer: string = '';

  /**
   * Добавляет порцию данных в буфер и извлекает из него полные пакеты.
   * @param chunk - Данные из сокета.
   * @returns Массив очищенных строк пакетов.
   */
  push(chunk: string): string[] {
    this.buffer += chunk;
    const packets: string[] = [];

    while (true) {
      const startIdx = this.buffer.indexOf('$');
      if (startIdx === -1) {
        this.buffer = '';
        break;
      }
      if (startIdx > 0) this.buffer = this.buffer.substring(startIdx);

      const starIdx = this.buffer.indexOf('*');
      if (starIdx === -1) break;

      const endIdx = starIdx + 5;
      if (this.buffer.length < endIdx) break;

      const raw = this.buffer.substring(0, endIdx);
      if (raw.endsWith('\r\n')) {
        packets.push(raw);
      }
      this.buffer = this.buffer.substring(endIdx);
    }
    return packets;
  }
}

/**
 * Отслеживает соответствие между отправленными запросами и входящими ответами.
 */
export class ResponseTracker {
  private pending = new Map<string, PendingRequest>();
  private queue: string[] = [];

  /**
   * @param useQueue - Если true, ответы сопоставляются по порядку (FIFO). 
   *                   Если false, ответы сопоставляются по ID транзакции.
   */
  constructor(private useQueue: boolean) {}

  /** Добавляет запрос в список ожидания. */
  add(id: string, request: PendingRequest) {
    this.pending.set(id, request);
    if (this.useQueue) this.queue.push(id);
  }

  /** Извлекает запрос при получении ответа. */
  pop(id?: string): PendingRequest | undefined {
    const key = (this.useQueue) ? this.queue.shift() : id;
    if (!key) return undefined;
    
    const req = this.pending.get(key);
    this.pending.delete(key);
    return req;
  }

  /** Сбрасывает все ожидающие запросы с ошибкой (например, при обрыве связи). */
  clear(err: Error) {
    this.pending.forEach(req => {
      clearTimeout(req.timer);
      req.reject(err);
    });
    this.pending.clear();
    this.queue = [];
  }
}

/**
 * Сетевое соединение с роботом Techman.
 * Реализует низкоуровневый обмен данными, переподключение и обработку таймаутов.
 * 
 * @emits packet - Вызывается при получении любого корректного пакета.
 * @emits error - Вызывается при ошибках парсинга или сетевых сбоях.
 */
export class TMConnection extends EventEmitter implements IConnection {
  private socket: Socket = new Socket();
  private framer = new PacketFramer();
  private tracker: ResponseTracker;
  private isExplicitlyClosed = false;

  /**
   * @param host - IP-адрес робота.
   * @param port - Порт (5890 для TMSCT, 8080 для TMSVR).
   * @param parser - Роутер для разбора входящих пакетов.
   * @param autoReconnect - Включить ли автоматическое переподключение при потере связи.
   */
  constructor(
    private readonly host: string,
    private readonly port: number,
    private readonly parser: IParserRouter = new ParserRouter(),
    private readonly autoReconnect: boolean = false
  ) {
    super();
    this.tracker = new ResponseTracker(this.port === 5890);
    this.setupListeners();
  }

  private setupListeners() {
    this.socket.on('data', (chunk) => {
      const rawPackets = this.framer.push(chunk.toString('utf8'));
      for (const raw of rawPackets) {
        try {
          const parsed = this.parser.routeAndParse(raw);
          this.handleIncoming(parsed);
        } catch (e) {
          this.emit('error', e);
        }
      }
    });

    this.socket.on('close', () => {
      this.tracker.clear(new TMConnectError('Connection lost'));
      if (this.autoReconnect && !this.isExplicitlyClosed) this.reconnect();
    });

    this.socket.on('error', (err) => this.emit('error', new TMConnectError(err.message)));
  }

  /**
   * Устанавливает соединение с роботом.
   * @throws {TMConnectError} Если не удалось подключиться.
   */
  async connect(): Promise<void> {
    this.isExplicitlyClosed = false;
    return new Promise((resolve, reject) => {
      const onConnect = () => {
        this.socket.off('error', onError);
        resolve();
      };
      const onError = (err: Error) => {
        this.socket.off('connect', onConnect);
        reject(new TMConnectError(err.message));
      };
      this.socket.once('connect', onConnect);
      this.socket.once('error', onError);
      this.socket.connect(this.port, this.host);
    });
  }

  /**
   * Отправляет пакет роботу и опционально ждет ответа.
   * 
   * @param packet - Сформированный пакет (из билдеров).
   * @param wait - Ждать ли ответа от робота (Promise разрешится только после ответа).
   * @param timeout - Время ожидания ответа в мс.
   * 
   * @returns Promise с распарсенным ответом или void, если wait = false.
   * 
   * @throws {TMConnectError} При таймауте ожидания.
   * @throws {TMProtocolError} Если робот вернул системную ошибку (CPERR).
   * 
   * @example
   * const response = await connection.execute(scriptPacket, true, 2000);
   */
  async execute<T extends ParsedSpecificPacket>(
    packet: BuiltPacket, 
    wait: boolean = true, 
    timeout = 5000
  ): Promise<T | void> {
    if (!wait) {
      this.socket.write(packet.raw);
      return;
    }

    return new Promise<T>((resolve, reject) => {
      const id = packet.id || `AUTO_${Date.now()}_${Math.random()}`;
      const timer = setTimeout(() => {
        this.tracker.pop(id);
        reject(new TMConnectError(`Timeout (${timeout}ms) for packet ${id}`));
      }, timeout);

      this.tracker.add(id, { resolve: resolve as any, reject, timer });
      this.socket.write(packet.raw);
    });
  }

  /**
   * Внутренняя обработка входящих данных.
   * Связывает ответ с ожидающим Promise через ResponseTracker.
   */
  private handleIncoming(parsed: ParsedSpecificPacket) {
    const id = (parsed as any).id;
    const req = this.tracker.pop(id);

    if (req) {
      clearTimeout(req.timer);
      if (parsed.header === 'CPERR') {
        req.reject(new TMProtocolError('CPERR', (parsed as any).message));
      } else {
        req.resolve(parsed);
      }
    }
    this.emit('packet', parsed);
  }

  private reconnect() {
    setTimeout(() => this.connect().catch(() => {}), 3000);
  }

  /**
   * Закрывает соединение и прекращает попытки переподключения.
   */
  disconnect() {
    this.isExplicitlyClosed = true;
    this.socket.destroy();
  }
}