import { Socket } from "socket.io";
import {
  AcknowledgeCallback,
  AcknowledgePayload,
  ClientEventsMap,
  ServerEventsMap,
} from "@/wss/types";
import { User } from "@/generated/prisma/client";

export abstract class WssHandler {
  protected readonly socket: Socket<ClientEventsMap, ServerEventsMap>;
  protected readonly user: User;

  constructor(socket: Socket<ClientEventsMap, ServerEventsMap>, user: User) {
    this.socket = socket;
    this.user = user;
  }

  protected broadcast<T extends keyof ServerEventsMap>(
    event: T,
    room: string,
    ...data: Parameters<ServerEventsMap[T]>
  ) {
    this.socket.emit(event, ...data);
    this.socket.broadcast.to(room).emit(event, ...data);
  }

  protected call(
    callback: AcknowledgeCallback | undefined,
    payload: AcknowledgePayload,
  ): void {
    if (!callback) return console.warn("[wss] callback is not defined");
    return callback(payload);
  }
}
