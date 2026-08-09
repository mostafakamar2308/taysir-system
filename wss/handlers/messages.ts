import { dayjs } from "@/lib/dayjs";
import { sendPushNotification } from "@/lib/notifications";
import prisma from "@/lib/prisma";
import { WssHandler } from "@/wss/handlers/base";
import {
  ClientEvent,
  ServerEvent,
  AcknowledgeCode,
  AcknowledgeCallback,
  RoomKind,
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
    data: { roomId: number; text: string; refId: string; kind?: RoomKind },
    callback?: AcknowledgeCallback,
  ) {
    try {
      const { roomId, text, refId, kind = "direct" } = data;
      const userId = this.user.id;

      if (!text || text.trim().length === 0) {
        this.call(callback, {
          code: AcknowledgeCode.EmptyText,
          message: "Cannot send empty message",
        });
        return;
      }

      if (kind === "group") {
        await this.sendGroupMessage(roomId, text, refId, callback);
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
        (await this.isAcademyStaff(room.academyId));

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

      const recipientUserId =
        room.tutorUserId === userId ? room.studentUserId : room.tutorUserId;
      if (recipientUserId !== userId) {
        sendPushNotification(recipientUserId, {
          title: "New message from " + message.sender.name,
          body: text.length > 50 ? text.substring(0, 47) + "..." : text,
          url: `/ar/dashboard/chat?room=${roomId}`,
        }).catch(console.error);
      }

      this.broadcast(ServerEvent.RoomMessage, asChatRoomId(roomId), {
        message,
        refId: refId || undefined,
      });
    } catch (err) {
      console.error(err);
    }
  }

  private async sendGroupMessage(
    roomId: number,
    text: string,
    refId: string,
    callback?: AcknowledgeCallback,
  ) {
    const userId = this.user.id;
    const room = await prisma.groupChatRoom.findUnique({
      where: { id: roomId },
      include: { group: { select: { title: true } } },
    });
    if (!room) {
      this.call(callback, { code: AcknowledgeCode.RoomNotFound });
      return;
    }

    const membership = await prisma.groupChatMember.findFirst({
      where: { roomId, userId, active: true },
    });
    const isStaff = await this.isAcademyStaff(room.academyId);
    if (!membership && !isStaff) {
      this.call(callback, { code: AcknowledgeCode.NotMember });
      return;
    }

    const message = await prisma.groupChatMessage.create({
      data: { roomId, senderId: userId, content: text, refId },
      include: {
        sender: {
          select: { id: true, name: true, imageUrl: true, role: true },
        },
      },
    });

    await prisma.groupChatRoom.update({
      where: { id: roomId },
      data: { updatedAt: new Date() },
    });

    // Notify all active members except the sender
    const members = await prisma.groupChatMember.findMany({
      where: { roomId, active: true },
      select: { userId: true },
    });
    for (const m of members) {
      if (m.userId === userId) continue;
      sendPushNotification(m.userId, {
        title: `${room.group.title}: ${message.sender.name}`,
        body: text.length > 50 ? text.substring(0, 47) + "..." : text,
        url: `/ar/dashboard/chat?room=${roomId}&kind=group`,
      }).catch(console.error);
    }

    this.broadcast(ServerEvent.RoomMessage, asChatRoomId(roomId, "group"), {
      message,
      refId: refId || undefined,
    });
  }

  // ---- Update Message ----
  private async onUpdateMessage(
    data: { id: number; text: string; kind?: RoomKind },
    callback?: AcknowledgeCallback,
  ) {
    try {
      const { id, text, kind = "direct" } = data;
      if (!text || text.trim().length === 0) {
        this.call(callback, { code: AcknowledgeCode.EmptyText });
        return;
      }

      if (kind === "group") {
        await this.updateMessageIn("group", id, text, callback);
        return;
      }

      await this.updateMessageIn("direct", id, text, callback);
    } catch (err) {
      console.error(err);
    }
  }

  private async updateMessageIn(
    kind: "direct" | "group",
    id: number,
    text: string,
    callback: AcknowledgeCallback | undefined,
  ) {
    const message =
      kind === "group"
        ? await prisma.groupChatMessage.findUnique({ where: { id } })
        : await prisma.chatMessage.findUnique({ where: { id } });
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

    const updated =
      kind === "group"
        ? await prisma.groupChatMessage.update({
            where: { id },
            data: { content: text, updatedAt: new Date() },
            include: {
              sender: {
                select: { id: true, name: true, imageUrl: true, role: true },
              },
            },
          })
        : await prisma.chatMessage.update({
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
      asChatRoomId(message.roomId, kind),
      { message: updated },
    );
  }

  // ---- Delete Message ----
  private async onDeleteMessage(
    data: { id: number; kind?: RoomKind },
    callback?: AcknowledgeCallback,
  ) {
    try {
      const { id, kind = "direct" } = data;
      const message =
        kind === "group"
          ? await prisma.groupChatMessage.findUnique({ where: { id } })
          : await prisma.chatMessage.findUnique({ where: { id } });
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

      if (kind === "group") {
        await prisma.groupChatMessage.update({
          where: { id },
          data: { isDeleted: true },
        });
      } else {
        await prisma.chatMessage.update({
          where: { id },
          data: { isDeleted: true },
        });
      }

      this.broadcast(
        ServerEvent.RoomMessageDeleted,
        asChatRoomId(message.roomId, kind),
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
    data: { id: number; kind?: RoomKind },
    callback?: AcknowledgeCallback,
  ) {
    try {
      const { id, kind = "direct" } = data;

      if (kind === "group") {
        await this.markGroupMessageRead(id, callback);
        return;
      }

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
        (await this.isAcademyStaff(room.academyId));

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

  private async markGroupMessageRead(
    id: number,
    callback?: AcknowledgeCallback,
  ) {
    const userId = this.user.id;
    const message = await prisma.groupChatMessage.findUnique({
      where: { id },
    });
    if (!message || message.isDeleted) {
      this.call(callback, { code: AcknowledgeCode.MessageNotFound });
      return;
    }

    const membership = await prisma.groupChatMember.findFirst({
      where: { roomId: message.roomId, userId, active: true },
    });
    const room = await prisma.groupChatRoom.findUnique({
      where: { id: message.roomId },
    });
    const isStaff = room ? await this.isAcademyStaff(room.academyId) : false;

    if (!membership && !isStaff) {
      this.call(callback, { code: AcknowledgeCode.NotMember });
      return;
    }

    if (membership && message.id > (membership.lastReadMessageId ?? 0)) {
      await prisma.groupChatMember.update({
        where: { id: membership.id },
        data: { lastReadMessageId: message.id },
      });
    }

    if (message.senderId !== userId) {
      await prisma.groupChatMessage.update({
        where: { id },
        data: { isRead: true, readAt: new Date() },
      });
    }

    this.broadcast(
      ServerEvent.RoomMessageRead,
      asChatRoomId(message.roomId, "group"),
      {
        userId,
        messageId: message.id,
        roomId: message.roomId,
      },
    );
  }

  // ---- User Typing ----
  private async onUserTyping(data: { roomId: number; kind?: RoomKind }) {
    try {
      const { roomId, kind = "direct" } = data;
      const roomName = asChatRoomId(roomId, kind);

      const isMember = await this.isRoomMember(roomId, kind);
      if (!isMember) return;

      this.socket.broadcast.to(roomName).emit(ServerEvent.UserTyping, {
        roomId,
        userId: this.user.id,
      });
    } catch (err) {
      console.error(err);
    }
  }

  // ---- Room membership helper ----
  private async isRoomMember(roomId: number, kind: RoomKind): Promise<boolean> {
    const userId = this.user.id;
    if (kind === "group") {
      const room = await prisma.groupChatRoom.findUnique({ where: { id: roomId } });
      if (!room) return false;
      const membership = await prisma.groupChatMember.findFirst({
        where: { roomId, userId, active: true },
      });
      if (membership) return true;
      return this.isAcademyStaff(room.academyId);
    }

    const room = await prisma.chatRoom.findUnique({ where: { id: roomId } });
    if (!room) return false;
    if (room.tutorUserId === userId || room.studentUserId === userId) return true;
    return this.isAcademyStaff(room.academyId);
  }

  // ---- Authorization helper ----
  private async isAcademyStaff(academyId: number): Promise<boolean> {
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
