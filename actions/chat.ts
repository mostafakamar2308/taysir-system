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
    currentUser.role === Role.Admin ||
    currentUser.role === Role.Supervisor;
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

export async function getGroupChatMessages(
  roomId: number,
): Promise<FullChatMessage[]> {
  const currentUser = await user();
  if (!currentUser) throw new Error("Unauthorized");

  const room = await db.groupChatRoom.findUnique({
    where: { id: roomId },
  });
  if (!room) throw new Error("Chat room not found");

  const membership = await db.groupChatMember.findFirst({
    where: { roomId, userId: currentUser.id, active: true },
  });
  const isAdmin = await isAcademyStaff(room.academyId, currentUser.id);
  if (!membership && !isAdmin) throw new Error("Unauthorized");

  return await db.groupChatMessage.findMany({
    where: { roomId, isDeleted: false },
    orderBy: { createdAt: "asc" },
    include: {
      sender: {
        select: { id: true, name: true, role: true, imageUrl: true },
      },
    },
  });
}

async function isAcademyStaff(academyId: number, userId: number) {
  const admin = await db.admin.findUnique({ where: { userId } });
  if (admin && admin.academyId === academyId) return true;
  const supervisor = await db.supervisor.findUnique({ where: { userId } });
  if (supervisor && supervisor.academyId === academyId) return true;
  return false;
}

const messageInclude = {
  sender: { select: { id: true, name: true, imageUrl: true, role: true } },
} as const;

export async function getChatsForUser(userId: number, role: number) {
  if (role === Role.Student) {
    const student = await db.student.findUnique({
      where: { userId },
      include: {
        groupMemberships: {
          where: { active: true },
          include: {
            group: {
              include: {
                currentTutor: {
                  include: {
                    user: { select: { id: true, name: true, imageUrl: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!student || student.groupMemberships.length === 0) return [];

    // Deduplicate by tutor userId
    const uniqueTutors = new Map<
      number,
      (typeof student.groupMemberships)[0]["group"]["currentTutor"]
    >();
    for (const membership of student.groupMemberships) {
      const tutor = membership.group.currentTutor;
      if (!uniqueTutors.has(tutor.userId)) {
        uniqueTutors.set(tutor.userId, tutor);
      }
    }

    const directChats = await Promise.all(
      Array.from(uniqueTutors.values()).map(async (tutor) => {
        return db.chatRoom.upsert({
          where: {
            tutorUserId_studentUserId: {
              tutorUserId: tutor.userId,
              studentUserId: userId, // student's user ID
            },
          },
          update: {},
          create: {
            tutorUserId: tutor.userId,
            studentUserId: userId,
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
              include: { sender: true },
            },
          },
        });
      }),
    );

    const groupChats = await getGroupChatRoomsForStudent(userId);

    const normalized = [
      ...directChats.map((c) => normalizeDirect(c)),
      ...groupChats,
    ];
    return sortByUpdatedAt(normalized);
  }

  // Tutor branch
  if (role === Role.Tutor) {
    const tutor = await db.tutor.findUnique({ where: { userId } });
    if (!tutor) return [];
    const directChats = await db.chatRoom.findMany({
      where: { tutorUserId: userId },
      include: {
        student: { select: { id: true, name: true, imageUrl: true } },
        tutor: { select: { id: true, name: true, imageUrl: true } },
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
          include: { sender: true },
        },
      },
    });

    const groupChats = await getGroupChatRoomsForUser(userId);

    const normalized = [
      ...directChats.map((c) => normalizeDirect(c)),
      ...groupChats,
    ];
    return sortByUpdatedAt(normalized);
  }

  // Admin/Supervisor branch
  if (role === Role.Admin || role === Role.Supervisor) {
    const admin = await db.admin.findUnique({ where: { userId } });
    const supervisor = await db.supervisor.findUnique({ where: { userId } });
    const academyId = admin?.academyId || supervisor?.academyId;
    if (!academyId) return [];

    const directChats = await db.chatRoom.findMany({
      where: { academyId },
      include: {
        student: { select: { id: true, name: true, imageUrl: true } },
        tutor: { select: { id: true, name: true, imageUrl: true } },
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
          include: { sender: true },
        },
      },
    });

    const groupChats = await getGroupChatRoomsForAcademy(academyId);

    const normalized = [
      ...directChats.map((c) => normalizeDirect(c)),
      ...groupChats,
    ];
    return sortByUpdatedAt(normalized);
  }

  return [];
}

// ---------- Group room queries ----------

async function getGroupChatRoomsForStudent(userId: number) {
  const student = await db.student.findUnique({
    where: { userId },
    select: { academyId: true },
  });
  if (!student) return [];

  const rooms = await db.groupChatRoom.findMany({
    where: {
      academyId: student.academyId,
      members: { some: { userId, active: true } },
    },
    include: {
      group: {
        select: {
          id: true,
          title: true,
          currentTutor: {
            select: {
              user: { select: { id: true, name: true, imageUrl: true } },
            },
          },
        },
      },
      members: {
        where: { active: true },
        include: {
          user: { select: { id: true, name: true, imageUrl: true } },
        },
      },
      messages: {
        take: 1,
        orderBy: { createdAt: "desc" },
        include: messageInclude,
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return rooms.map((r) => normalizeGroup(r, userId));
}

async function getGroupChatRoomsForUser(userId: number) {
  const rooms = await db.groupChatRoom.findMany({
    where: { members: { some: { userId, active: true } } },
    include: {
      group: {
        select: {
          id: true,
          title: true,
          currentTutor: {
            select: {
              user: { select: { id: true, name: true, imageUrl: true } },
            },
          },
        },
      },
      members: {
        where: { active: true },
        include: { user: { select: { id: true, name: true, imageUrl: true } } },
      },
      messages: {
        take: 1,
        orderBy: { createdAt: "desc" },
        include: messageInclude,
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return rooms.map((r) => normalizeGroup(r, userId));
}

async function getGroupChatRoomsForAcademy(academyId: number) {
  const rooms = await db.groupChatRoom.findMany({
    where: { academyId },
    include: {
      group: {
        select: {
          id: true,
          title: true,
          currentTutor: {
            select: {
              user: { select: { id: true, name: true, imageUrl: true } },
            },
          },
        },
      },
      members: {
        where: { active: true },
        include: {
          user: { select: { id: true, name: true, imageUrl: true } },
        },
      },
      messages: {
        take: 1,
        orderBy: { createdAt: "desc" },
        include: messageInclude,
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return rooms.map((r) => normalizeGroup(r, null));
}

// ---------- Normalizers ----------

type DirectRoom = {
  id: number;
  tutor: { id: number; name: string | null; imageUrl: string | null };
  student: { id: number; name: string | null; imageUrl: string | null };
  messages: { sender?: { id?: number; name?: string | null } }[];
  isClosed: boolean;
  updatedAt: Date;
};

function normalizeDirect(c: DirectRoom) {
  return {
    id: c.id,
    kind: "direct" as const,
    tutor: c.tutor,
    student: c.student,
    groupTitle: null as string | null,
    members: null as null,
    messages: c.messages as unknown as FullChatMessage[],
    isClosed: c.isClosed,
    updatedAt: c.updatedAt,
  };
}

type GroupRoom = {
  id: number;
  group: {
    id: number;
    title: string;
    currentTutor: {
      user: { id: number; name: string | null; imageUrl: string | null };
    };
  };
  members: {
    user: { id: number; name: string | null; imageUrl: string | null };
    lastReadMessageId: number | null;
  }[];
  messages: FullChatMessage[];
  updatedAt: Date;
};

function normalizeGroup(r: GroupRoom, userId: number | null) {
  const me = r.members.find((m) => m.user.id === userId);
  return {
    id: r.id,
    kind: "group" as const,
    tutor: {
      id: r.group.currentTutor.user.id,
      name: r.group.currentTutor.user.name,
      imageUrl: r.group.currentTutor.user.imageUrl,
    },
    student: null,
    groupId: r.group.id,
    groupTitle: r.group.title,
    members: r.members.map((m) => m.user),
    lastReadMessageId: me?.lastReadMessageId ?? null,
    messages: r.messages as unknown as FullChatMessage[],
    isClosed: false,
    updatedAt: r.updatedAt,
  };
}

function sortByUpdatedAt<T extends { updatedAt: Date }>(items: T[]) {
  return items.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}
