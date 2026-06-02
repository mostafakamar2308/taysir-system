import "dotenv/config";
import { Socket } from "socket.io";
import db from "@/lib/prisma";
import { User } from "@/generated/prisma/client";
import { verifyToken } from "@/lib/jwt";

interface AuthenticatedSocket extends Socket {
  data: {
    user: User;
  };
}

export const authenticateSocket = async (
  socket: AuthenticatedSocket,
  next: (err?: Error) => void,
) => {
  try {
    const token = socket.handshake.auth.token as string;
    if (!token) throw new Error("No token provided");

    const payload = verifyToken(token);

    if (!payload) throw new Error("Invalid token");

    const u = await db.user.findUnique({
      where: { id: payload.id },
    });

    if (!u) throw new Error("User not found");
    socket.data.user = u;
    next();
  } catch (err) {
    console.log(err);

    next(new Error("Authentication failed"));
  }
};
