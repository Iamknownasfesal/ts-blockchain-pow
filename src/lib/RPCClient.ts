import * as net from "net";

// The main class that manages the RPC client
export class RPCClient {
  // Sends a request to the server
  public static async request(
    method: string,
    params: any[],
    callback: (error: Error | null, result?: any) => void
  ): Promise<void> {
    const socket = net.createConnection({ port: 8000 }, () => {
      socket.write(JSON.stringify({ method, params }));
    });

    socket.on("data", (data) => {
      const response = JSON.parse(data.toString());
      if (response.error) {
        callback(new Error(response.error));
      } else {
        callback(null, response.result);
      }
      socket.end();
    });

    socket.on("error", (error) => {
      callback(error);
    });
  }
}
