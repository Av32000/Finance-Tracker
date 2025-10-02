import { WSEvent, WSEventType } from "@finance-tracker/types";
import { Server } from "ws";

export class FTWSServer {
  wss: Server;

  constructor(server: any) {
    this.wss = new Server({ server, path: "/ws" });
    this.wss.on("connection", (ws) => {
      ws.on("message", (message) => {
        try {
          const event: WSEvent = JSON.parse(message.toString());
          if (event.type === WSEventType.PING) {
            ws.send(
              JSON.stringify({ type: WSEventType.PONG, timestamp: Date.now() }),
            );
          }
        } catch (err) {
          ws.send(
            JSON.stringify({
              type: WSEventType.ERROR,
              error: "Invalid message format",
            }),
          );
        }
      });
    });
  }

  broadcast(event: WSEvent) {
    this.wss.clients.forEach((client) => {
      if (client.readyState === client.OPEN) {
        event.timestamp = Date.now();
        client.send(JSON.stringify(event));
      }
    });
  }
}
