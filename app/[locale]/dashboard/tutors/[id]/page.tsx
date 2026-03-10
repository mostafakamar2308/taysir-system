import db from "@/lib/prisma";
import { notFound } from "next/navigation";
import TutorProfileClient from "@/components/dashboard/tutorProfile/viewer";
import type {
  TutorProfile,
  AssignedStudent,
  TutorSession,
  TutorNote,
  TutorAvailability,
} from "@/types/tutor";
import {
  attendanceStatusMap,
  sessionStatusMap,
  studentStatusMap,
} from "@/components/dashboard/studentProfile/viewer";

export default async function TutorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = parseInt((await params).id);
  if (isNaN(id)) notFound();

  const tutor = await db.tutor.findUnique({
    where: { id },
    include: {
      user: true,
      specialities: true,
      students: {
        include: {
          plan: true,
          sessions: {
            where: {
              startTime: { gt: new Date() },
              status: 0, // SCHEDULED
            },
            orderBy: { startTime: "asc" },
            take: 1,
          },
        },
      },
      sessions: {
        include: {
          student: true,
          attendance: true,
        },
        orderBy: { startTime: "desc" },
      },
      notes: {
        include: { author: true },
        orderBy: { createdAt: "desc" },
      },
      tutorAvailabilities: true,
    },
  });

  if (!tutor) notFound();

  // Transform students
  const transformedStudents: AssignedStudent[] = tutor.students.map((s) => ({
    id: s.id,
    name: s.name,
    age: s.age,
    status: studentStatusMap[s.status],
    planTitle: s.plan?.title ?? null,
    nextSessionDate: s.sessions[0]?.startTime.toISOString() ?? null,
  }));

  // Transform sessions
  const transformedSessions: TutorSession[] = tutor.sessions.map((s) => ({
    id: s.id,
    startTime: s.startTime.toISOString(),
    endTime: s.endTime.toISOString(),
    durationMinutes: s.durationMinutes,
    status: sessionStatusMap[s.status],
    topic: s.topic,
    studentId: s.studentId,
    studentName: s.student.name,
    attendance: s.attendance
      ? {
          id: s.attendance.id,
          status: attendanceStatusMap[s.attendance.status],
          reason: s.attendance.reason,
        }
      : undefined,
  }));

  // Transform notes
  const transformedNotes: TutorNote[] = tutor.notes.map((n) => ({
    id: n.id,
    content: n.content,
    authorName: n.author.name ?? "مستخدم",
    createdAt: n.createdAt.toISOString(),
  }));

  // Transform availabilities
  const transformedAvailabilities: TutorAvailability[] =
    tutor.tutorAvailabilities.map((a) => ({
      id: a.id,
      dayOfWeek: a.dayOfWeek,
      startTime: a.startTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      endTime: a.endTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
    }));

  const transformed: TutorProfile = {
    id: tutor.id,
    name: tutor.user.name ?? "",
    email: tutor.user.email,
    phone: tutor.phone,
    timezone: tutor.user.timezone,
    academyName:
      (
        await db.academy.findUnique({
          where: { id: tutor.academyId },
          select: { name: true },
        })
      )?.name ?? "",
    pricePerSession: tutor.pricePerSession,
    specialities: tutor.specialities.map((s) => s.title),
    active: tutor.active ?? false,
    bio: tutor.bio,
    qualifications: tutor.qualifications,
    profilePicture: tutor.profilePicture,
    maxStudents: tutor.maxStudents,
    availabilities: transformedAvailabilities,
    students: transformedStudents,
    sessions: transformedSessions,
    notes: transformedNotes,
    payments: [],
  };

  return <TutorProfileClient tutor={transformed} />;
}
