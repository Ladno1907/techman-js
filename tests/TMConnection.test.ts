import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { createServer, Server } from 'node:net';
import { TMConnection } from '../src/network/tm-connection.js';

describe('TMConnection (Простой тест)', () => {
  let server: Server;
  const PORT = 5890;
  const HOST = '127.0.0.1';

  beforeAll(() => {
    server = createServer((socket) => {
      socket.on('data', () => {
        socket.write('$TMSTA,15,00,true,Listen1,*79\r\n'); 
      });
    });
    server.listen(PORT, HOST);
  });

  afterAll(() => {
    server.close();
  });

  it('должен подключиться к серверу и получить ответ', async () => {
    const robot = new TMConnection(HOST, PORT, false);
    await robot.connect();
    const mockPacket = { id: '1', raw: '$TMSTA,2,00,*41\r\n' } as any;
    const result = await robot.execute(mockPacket);
    expect(result).toBeDefined();
    robot.disconnect();
  });
});
