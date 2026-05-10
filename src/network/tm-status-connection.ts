// src/network/TMStatusConnection.ts

import { TMConnection } from './tm-connection.js';

/**
 * Канал мониторинга (Порт 5891)
 */
export class TMStatusConnection extends TMConnection {
  constructor(host: string, autoReconnect: boolean = true) {
    super(host, 5891, autoReconnect);
  }
}
