import db from "@/lib/prisma";
import { WssHandler } from "@/wss/handlers/base";
import {
  AcknowledgeCallback,
  AcknowledgeCode,
  ClientEvent,
  ServerEvent,
} from "@/wss/types";
import { asChatRoomId } from "@/wss/utils";

const onlineUsers = new Map<number, Set<string>>();

export class Connection extends WssHandler {
  init(): this {
    this.socket.on("disconnect", () => this.onDisconnect());
    this.socket.on(ClientEvent.JoinRoom, this.onJoinRoom.bind(this));
    this.socket.on(ClientEvent.LeaveRoom, this.onLeaveRoom.bind(this));
    this.markOnline();
    return this;
  }

  private async onJoinRoom(
    data: { roomId: number },
    callback?: AcknowledgeCallback,
  ) {
    try {
      const { roomId } = data;
      const room = await db.chatRoom.findUnique({
        where: { id: roomId },
      });
      if (!room) {
        this.call(callback, { code: AcknowledgeCode.RoomNotFound });
        return;
      }

      const userId = this.user.id;
      // Check if the user is a member (tutor, student, or admin of the academy)
      const isMember =
        room.tutorUserId === userId ||
        room.studentUserId === userId ||
        (await this.isAcademyAdmin(room.academyId));

      if (!isMember) {
        this.call(callback, { code: AcknowledgeCode.NotMember });
        return;
      }

      this.socket.join(asChatRoomId(roomId));
      this.call(callback, { code: AcknowledgeCode.Success });
      console.log(`User ${userId} joined room ${roomId}`);
    } catch (err) {
      console.error(err);
    }
  }

  private onLeaveRoom(data: { roomId: number }) {
    this.socket.leave(asChatRoomId(data.roomId));
  }

  private async isAcademyAdmin(academyId: number): Promise<boolean> {
    const user = this.user;
    const admin = await db.admin.findUnique({ where: { userId: user.id } });
    if (admin && admin.academyId === academyId) return true;

    const supervisor = await db.supervisor.findUnique({
      where: { userId: user.id },
    });
    if (supervisor && supervisor.academyId === academyId) return true;

    return false;
  }

  private markOnline() {
    const userId = this.user.id;
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    const sockets = onlineUsers.get(userId)!;
    const wasOffline = sockets.size === 0;
    sockets.add(this.socket.id);

    if (wasOffline) {
      // Broadcast to all rooms this user belongs to (optional)
      // For now just emit a global event; you can target specific rooms if needed
      this.socket.broadcast.emit(ServerEvent.UserOnline, { userId });
    }
  }

  private onDisconnect() {
    const userId = this.user.id;
    const sockets = onlineUsers.get(userId);
    if (sockets) {
      sockets.delete(this.socket.id);
      if (sockets.size === 0) {
        onlineUsers.delete(userId);
        this.socket.broadcast.emit(ServerEvent.UserOffline, { userId });
      }
    }
  }
}
