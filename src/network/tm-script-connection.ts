import { IConnection } from '../types/index.js';
import { TMConnection } from './tm-connection.js';
import { TMScriptClient } from './tm-script-client.js';
import { ParserRouter } from '../protocol/parsers/packet-parser.js';
import { IParserRouter } from '../types/index.js';
import { TMSCTBuilder } from '../protocol/builders/TMSCTBuilder.js';
import { TMSTABuilder } from '../protocol/builders/TMSTABuilder.js';

export class TMScriptConnection {
  private readonly connection: IConnection;
  public client: TMScriptClient;

  constructor(
    host: string,
    port: number = 5890,
    parser: IParserRouter = new ParserRouter(),
    autoReconnect: boolean = false
  ) {
    this.connection = new TMConnection(host, port, parser, autoReconnect);

    const tmsct = new TMSCTBuilder();
    const tmsta = new TMSTABuilder();

    this.client = new TMScriptClient(
      this.connection,
      tmsct.system,
      tmsct.config,
      tmsct.motion,
      tmsta
    );
  }

  async connect() { return this.connection.connect(); }
  disconnect() { this.connection.disconnect(); }

  //get socket() { return this.connection; }
}

/*
export class TMScriptConnection {
  private readonly connection: TMConnection;
  private readonly client: TMScriptClient;

  constructor(
    host: string,
    port: number = 5890,
    parser: IParserRouter = new ParserRouter(),
    autoReconnect: boolean = false
  ) {
    this.connection = new TMConnection(host, port, parser, autoReconnect);
    this.client = new TMScriptClient(this.connection);

    return new Proxy(this, {
      get: (target, prop, receiver) => {
        if (prop in target) {
          return Reflect.get(target, prop, receiver);
        }
        const clientValue = Reflect.get(this.client, prop);
        if (typeof clientValue === 'function') {
          return clientValue.bind(this.client);
        }
        return clientValue;
      }
    });
  }

  async connect(): Promise<void> {
    return this.connection.connect();
  }

  disconnect(): void {
    this.connection.disconnect();
  }

  get socket() {
    return this.connection;
  }
}
*/
