import * as net from "net";
import { EventEmitter } from "events";

const PORT = 8000;

// The main class that manages the RPC server and clients
class RPCManager extends EventEmitter {
  private server: net.Server;
  private clients: net.Socket[];

  constructor() {
    super();
    this.server = net.createServer((socket) => this.handleConnection(socket));
    this.clients = [];
  }

  // Handles incoming connections to the server
  private handleConnection(socket: net.Socket): void {
    this.clients.push(socket);
    socket.on("data", (data) => this.handleData(socket, data));
    socket.on("close", () => this.handleClose(socket));
  }

  // Handles incoming data from a client
  private handleData(socket: net.Socket, data: Buffer): void {
    const request = JSON.parse(data.toString());
    console.log(`Received request: ${request.method}`);
    this.emit(request.method, request.params, (result: any) => {
      socket.write(JSON.stringify({ result }));
      socket.end();
    });
  }

  // Handles the closing of a connection
  private handleClose(socket: net.Socket): void {
    this.clients = this.clients.filter((client) => client !== socket);
  }

  // Starts the RPC server
  public start(): void {
    this.server.listen(PORT);
  }

  // Stops the RPC server
  public stop(): void {
    this.server.close();
    this.clients.forEach((client) => client.destroy());
  }
}

export { RPCManager };
