import { Socket } from "socket.io";
import { Connection } from "./connection";
import { Messages } from "./messages";
import { User } from "@/generated/prisma/client";

export class WssHandlers {
  public readonly connection: Connection;
  public readonly messages: Messages;

  constructor(socket: Socket, user: User) {
    this.connection = new Connection(socket, user).init();
    this.messages = new Messages(socket, user).init();
  }
}
