import * as net from "net";

// The main class that manages the RPC client
export class RPCClient {
  private socket: net.Socket;

  constructor() {
    this.socket = net.createConnection({ port: 8000 });
  }

  // Sends a request to the server
  public async request(
    method: string,
    params: any[],
    callback: (error: Error | null, result?: any) => void
  ): Promise<void> {
    this.socket.write(JSON.stringify({ method, params }));
    this.socket.on("data", async (data) => {
      const response = JSON.parse(data.toString());
      if (response.error) {
        callback(new Error(response.error));
      } else {
        callback(null, response.result);
      }
    });
  }
}
