// server.ts
import { createServer } from "http";
import { Server } from "socket.io";
import { authenticateSocket } from "./wss/auth";
import { WssHandlers } from "./wss/handlers";

const WS_PORT = parseInt(process.env.WS_PORT || "3001", 10);

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || "*",
    methods: ["GET", "POST"],
  },
});

io.use(authenticateSocket);

io.on("connection", (socket) => {
  new WssHandlers(socket, socket.data.user);
});

httpServer.listen(WS_PORT, () => {
  console.log(`🔌 WebSocket server running on port ${WS_PORT}`);
});
