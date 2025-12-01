import { WebSocket, WebSocketServer } from "ws";
import wsAuthMiddleware from "../middleware/wsAuthMiddleware.js";
import { prismaClient } from "../db/client.js";
import { SignallingServer } from "./signalling.js";
import { IncomingMessage } from "http";

export interface ConnectedUserType {
  ws: WebSocket,
  userId: string,
  rooms: Set<string>
}

const connectedUser: ConnectedUserType[] = [];

export function initWebSocket(server: any) {

  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws: WebSocket, request: IncomingMessage) => {

    // 1. Better Logging & URL Parsing
    console.log(`WS: Connection attempt from ${request.socket.remoteAddress}`);
    
    // We use a dummy base because request.url is just the path (e.g. "/?wstoken=...")
    // This allows the URL constructor to parse it correctly regardless of environment
    const url = request.url || "";
    const myURL = new URL(url, `http://${request.headers.host || "localhost"}`);
    
    const token = myURL.searchParams.get('wstoken') || "";

    console.log("WS: Extracted Token:", token ? `${token.substring(0, 10)}...` : "None found");

    // 2. Auth Check
    const userId = wsAuthMiddleware(token);

    if (userId === null) {
      console.log("WS: Auth Failed - Invalid Token. Closing connection.");
      ws.close();
      return;
    }

    // 3. User Connected
    const user: ConnectedUserType = {
      ws,
      userId,
      rooms: new Set()
    }

    connectedUser.push(user);
    console.log(`WS Connected: User ${userId}`);

    // Send confirmation to client
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: "connected",
            userId
        }));
    }

    ws.on('message', async (data) => {
      const rawData = data.toString();
      let parsedData;
      
      try {
        parsedData = JSON.parse(rawData)
      } catch (error) {
        console.log("WS Parse Error:", error)
        return;
      }

      if (parsedData.type === "join-room") {
        const roomId = String(parsedData.roomId)
        
        try {
            const room = await prismaClient.room.findUnique({
              where: { id: roomId }
            })

            if (!room) {
              ws.send(JSON.stringify({
                type: "Error",
                message: "Room Does not exist"
              }));
              return;
            }

            user?.rooms.add(roomId)
            console.log(`User ${userId} joined Room ${roomId}`);

            // Notify others
            connectedUser.forEach((u) => {
              if (u.rooms.has(roomId) && u.userId !== userId) {
                u.ws.send(JSON.stringify({
                  type: "user-joined",
                  roomId,
                  userId
                }));
              }
            });
        } catch(e) {
            console.log("Error joining room:", e);
        }
        
      } else if (parsedData.type === "leave-room") {
        const roomId = String(parsedData.roomId);
        user.rooms.delete(roomId)
        
        connectedUser.forEach((u) => {
          if (u.rooms.has(roomId) && u.userId !== userId) {
            u.ws.send(JSON.stringify({
              type: "user-left",
              roomId,
              userId
            }));
          }
        });
        console.log(`User ${userId} left room ${roomId}`);

      } else if (parsedData.type === "chat") {
        const roomId = String(parsedData.roomId);
        const message = parsedData.message;

        try {
            await prismaClient.chat.create({
              data: { roomId, message, userId }
            });

            connectedUser.forEach((u) => {
              if (u.rooms.has(roomId)) {
                u.ws.send(
                  JSON.stringify({
                    type: "chat",
                    roomId,
                    message,
                    sender: userId,
                  })
                );
              }
            });
        } catch(e) {
            console.log("Error saving chat:", e);
        }

      } else if (["offer", "answer", "ice-candidate"].includes(parsedData.type)) {
        SignallingServer(ws, parsedData, userId, connectedUser);
      }
    });

    ws.on("close", () => {
      const index = connectedUser.indexOf(user);
      if (index !== -1) {
        connectedUser.splice(index, 1);
      }
      console.log(`WS disconnected ${userId}`)
    });
  });

  console.log("WebSocket server initialized");
}
