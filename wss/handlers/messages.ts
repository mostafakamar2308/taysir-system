import { dayjs } from "@/lib/dayjs";
import prisma from "@/lib/prisma";
import { WssHandler } from "@/wss/handlers/base";
import {
  ClientEvent,
  ServerEvent,
  AcknowledgeCode,
  AcknowledgeCallback,
} from "@/wss/types";
import { asChatRoomId } from "@/wss/utils";

const DELETE_EDIT_WINDOW_MINUTES = 15;

export class Messages extends WssHandler {
  init(): this {
    this.socket.on(ClientEvent.SendMessage, this.onSendMessage.bind(this));
    this.socket.on(ClientEvent.UpdateMessage, this.onUpdateMessage.bind(this));
    this.socket.on(ClientEvent.DeleteMessage, this.onDeleteMessage.bind(this));
    this.socket.on(
      ClientEvent.MarkMessageAsRead,
      this.onMarkMessageAsRead.bind(this),
    );
    this.socket.on(ClientEvent.UserTyping, this.onUserTyping.bind(this));
    return this;
  }

  // ---- Send Message ----
  private async onSendMessage(
    data: { roomId: number; text: string; refId: string },
    callback?: AcknowledgeCallback,
  ) {
    try {
      const { roomId, text, refId } = data;
      const userId = this.user.id;

      if (!text || text.trim().length === 0) {
        this.call(callback, {
          code: AcknowledgeCode.EmptyText,
          message: "Cannot send empty message",
        });
        return;
      }

      const room = await prisma.chatRoom.findUnique({
        where: { id: roomId },
      });
      if (!room) {
        this.call(callback, { code: AcknowledgeCode.RoomNotFound });
        return;
      }

      const isMember =
        room.tutorUserId === userId ||
        room.studentUserId === userId ||
        (await this.isAcademyAdmin(room.academyId));

      if (!isMember) {
        this.call(callback, { code: AcknowledgeCode.NotMember });
        return;
      }

      const message = await prisma.chatMessage.create({
        data: {
          roomId,
          senderId: userId,
          content: text,
          refId,
        },
        include: {
          sender: {
            select: { id: true, name: true, imageUrl: true, role: true },
          },
        },
      });

      this.broadcast(ServerEvent.RoomMessage, asChatRoomId(roomId), {
        message,
        refId: refId || undefined,
      });
    } catch (err) {
      console.error(err);
    }
  }

  // ---- Update Message ----
  private async onUpdateMessage(
    data: { id: number; text: string },
    callback?: AcknowledgeCallback,
  ) {
    try {
      const { id, text } = data;
      if (!text || text.trim().length === 0) {
        this.call(callback, { code: AcknowledgeCode.EmptyText });
        return;
      }

      const message = await prisma.chatMessage.findUnique({ where: { id } });
      if (!message || message.isDeleted) {
        this.call(callback, { code: AcknowledgeCode.MessageNotFound });
        return;
      }

      if (message.senderId !== this.user.id) {
        this.call(callback, { code: AcknowledgeCode.NotOwner });
        return;
      }

      const createdAt = dayjs(message.createdAt);
      if (dayjs().diff(createdAt, "minute") > DELETE_EDIT_WINDOW_MINUTES) {
        this.call(callback, {
          code: AcknowledgeCode.DeleteEditTimeExpired,
          message:
            "You can only edit a message within 15 minutes of sending it.",
        });
        return;
      }

      const updated = await prisma.chatMessage.update({
        where: { id },
        data: { content: text, updatedAt: new Date() },
        include: {
          sender: {
            select: { id: true, name: true, imageUrl: true, role: true },
          },
        },
      });

      this.broadcast(
        ServerEvent.RoomMessageUpdated,
        asChatRoomId(message.roomId),
        {
          message: updated,
        },
      );
    } catch (err) {
      console.error(err);
    }
  }

  // ---- Delete Message ----
  private async onDeleteMessage(
    data: { id: number },
    callback?: AcknowledgeCallback,
  ) {
    try {
      const { id } = data;
      const message = await prisma.chatMessage.findUnique({ where: { id } });
      if (!message || message.isDeleted) {
        this.call(callback, { code: AcknowledgeCode.MessageNotFound });
        return;
      }
      if (message.senderId !== this.user.id) {
        this.call(callback, { code: AcknowledgeCode.NotOwner });
        return;
      }

      const createdAt = dayjs(message.createdAt);
      if (dayjs().diff(createdAt, "minute") > DELETE_EDIT_WINDOW_MINUTES) {
        this.call(callback, {
          code: AcknowledgeCode.DeleteEditTimeExpired,
          message:
            "You can only delete a message within 15 minutes of sending it.",
        });
        return;
      }

      await prisma.chatMessage.update({
        where: { id },
        data: { isDeleted: true },
      });

      this.broadcast(
        ServerEvent.RoomMessageDeleted,
        asChatRoomId(message.roomId),
        {
          roomId: message.roomId,
          messageId: message.id,
        },
      );
    } catch (err) {
      console.error(err);
    }
  }

  // ---- Mark as Read ----
  private async onMarkMessageAsRead(
    data: { id: number },
    callback?: AcknowledgeCallback,
  ) {
    try {
      const { id } = data;
      const message = await prisma.chatMessage.findUnique({ where: { id } });
      if (!message || message.isDeleted) {
        this.call(callback, { code: AcknowledgeCode.MessageNotFound });
        return;
      }

      const room = await prisma.chatRoom.findUnique({
        where: { id: message.roomId },
      });
      if (!room) return;

      const isMember =
        room.tutorUserId === this.user.id ||
        room.studentUserId === this.user.id ||
        (await this.isAcademyAdmin(room.academyId));

      if (!isMember) {
        this.call(callback, { code: AcknowledgeCode.NotMember });
        return;
      }

      if (message.senderId === this.user.id) {
        this.call(callback, {
          code: AcknowledgeCode.Unallowed,
          message: "Cannot mark own message as read",
        });
        return;
      }

      await prisma.chatMessage.update({
        where: { id },
        data: { isRead: true, readAt: new Date() },
      });

      this.broadcast(
        ServerEvent.RoomMessageRead,
        asChatRoomId(message.roomId),
        {
          userId: this.user.id,
          messageId: message.id,
          roomId: message.roomId,
        },
      );
    } catch (err) {
      console.error(err);
    }
  }

  // ---- User Typing ----
  private async onUserTyping(data: { roomId: number }) {
    try {
      const room = await prisma.chatRoom.findUnique({
        where: { id: data.roomId },
      });
      if (!room) return;

      const isMember =
        room.studentUserId === this.user.id ||
        room.tutorUserId === this.user.id ||
        (await this.isAcademyAdmin(room.academyId));

      if (!isMember) return;

      this.socket.broadcast
        .to(asChatRoomId(data.roomId))
        .emit(ServerEvent.UserTyping, {
          roomId: data.roomId,
          userId: this.user.id,
        });
    } catch (err) {
      console.error(err);
    }
  }

  // ---- Authorization helper ----
  private async isAcademyAdmin(academyId: number): Promise<boolean> {
    const user = this.user;
    const admin = await prisma.admin.findUnique({ where: { userId: user.id } });
    if (admin && admin.academyId === academyId) return true;

    const supervisor = await prisma.supervisor.findUnique({
      where: { userId: user.id },
    });
    if (supervisor && supervisor.academyId === academyId) return true;

    return false;
  }
}
