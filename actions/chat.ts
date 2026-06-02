"use server";
import { user } from "@/lib/auth";
import db from "@/lib/prisma";
import { Role } from "@/types/user";
import { FullChatMessage } from "@/wss/types";

export async function getChatMessages(
  roomId: number,
): Promise<FullChatMessage[]> {
  const currentUser = await user();
  if (!currentUser) throw new Error("Unauthorized");

  const room = await db.chatRoom.findUnique({
    where: { id: roomId },
  });
  if (!room) throw new Error("Chat room not found");

  const isParticipant =
    room.tutorUserId === currentUser.id ||
    room.studentUserId === currentUser.id ||
    currentUser.role === Role.Admin;
  if (!isParticipant) throw new Error("Unauthorized");

  return await db.chatMessage.findMany({
    where: { roomId, isDeleted: false },
    orderBy: { createdAt: "asc" },
    include: {
      sender: {
        select: { id: true, name: true, role: true, imageUrl: true },
      },
    },
  });
}

export async function getChatsForUser(userId: number, role: number) {
  if (role === Role.Student) {
    // A student has only one chat with their tutor (if assigned)
    const student = await db.student.findUnique({
      where: { userId },
      include: {
        tutor: { include: { user: { select: { id: true, name: true } } } },
      },
    });
    if (!student || !student.tutor) return [];
    const chat = await db.chatRoom.upsert({
      where: {
        tutorUserId_studentUserId: {
          tutorUserId: student.tutor.userId,
          studentUserId: student.userId,
        },
      },
      update: {},
      create: {
        tutorUserId: student.tutor.userId,
        studentUserId: student.userId,
        academyId: student.academyId,
      },
      include: {
        tutor: {
          select: { id: true, name: true, imageUrl: true },
        },

        student: {
          select: { id: true, name: true, imageUrl: true },
        },

        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
          include: {
            sender: true,
          },
        },
      },
    });
    return [chat];
  }

  if (role === Role.Tutor) {
    const tutor = await db.tutor.findUnique({ where: { userId } });
    if (!tutor) return [];
    const chats = await db.chatRoom.findMany({
      where: { tutorUserId: tutor.userId },
      include: {
        student: {
          select: { id: true, name: true, imageUrl: true },
        },

        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
          include: {
            sender: true,
          },
        },
        tutor: {
          select: { id: true, name: true, imageUrl: true },
        },
      },

      orderBy: { updatedAt: "desc" },
    });
    return chats;
  }

  if (role === Role.Admin || role === Role.Supervisor) {
    const admin = await db.admin.findUnique({ where: { userId } });
    const supervisor = await db.supervisor.findUnique({
      where: { userId },
    });
    const academyId = admin?.academyId || supervisor?.academyId;
    if (!academyId) return [];

    const chats = await db.chatRoom.findMany({
      where: { academyId },
      include: {
        student: {
          select: { id: true, name: true, imageUrl: true },
        },
        tutor: {
          select: { id: true, name: true, imageUrl: true },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
          include: {
            sender: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
    return chats;
  }

  return [];
}
