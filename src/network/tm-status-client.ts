// src/network/clients/TMStatusClient.ts

import { IConnection } from '../types/index.js';

/**
 * Клиент управления роботом (для работы через TMConnection на порту 5891)
 */
export class TMStatusClient {

  constructor(private connection: IConnection) {}

}