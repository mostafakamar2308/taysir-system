import db from "@/lib/prisma";
import { user } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@/types/user";
import StudentsClient from "@/components/tutor/students/viewer";
import { getSessionStatus } from "@/lib/session";
import dayjs from "dayjs";

export default async function TutorStudentsPage() {
  const currentUser = await user();
  if (!currentUser || currentUser.role !== Role.Tutor || !currentUser.tutorId) {
    redirect("/login");
  }
  const tutorId = currentUser.tutorId;

  const students = await db.student.findMany({
    where: { tutorId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      status: true,
      sessions: {
        where: {
          tutorId,
          startTime: {
            lte: dayjs().endOf("month").toDate(),
            gte: dayjs().startOf("month").toDate(),
          },
        },
        orderBy: { startTime: "desc" },
        include: {
          attendance: true,
          sessionReport: true,
          student: true,
        },
      },
    },
  });

  const transformedStudents = students.map((student) => ({
    id: student.id,
    name: student.name,
    email: student.email,
    phone: student.phone,
    status: student.status,
    sessions: student.sessions.map((s) => ({
      id: s.id,
      startTime: s.startTime.toISOString(),
      endTime: s.endTime.toISOString(),
      durationMinutes: s.durationMinutes,
      status: getSessionStatus(s),
      topic: s.topic,
      notes: s.notes,
      studentId: s.studentId,
      studentName: s.student.name,
      isTrial: s.isTrial,
      tutorId: s.tutorId,
      tutorName: currentUser.name,
      recurringPatternId: s.recurringPatternId,
      attendance: s.attendance
        ? {
            id: s.attendance.id,
            tutorAttendance: s.attendance.tutorAttendanceStatus,
            studentAttendance: s.attendance.studentAttendanceStatus,
            reason: s.attendance.reason,
          }
        : undefined,
      report: s.sessionReport
        ? {
            id: s.sessionReport.id,
            rating: s.sessionReport.rating,
            outcomes: s.sessionReport.outcomes,
            strengths: s.sessionReport.strengths,
            weaknesses: s.sessionReport.weaknesses,
            nextGoals: s.sessionReport.nextGoals,
            comments: s.sessionReport.comments,
          }
        : undefined,
    })),
  }));

  return <StudentsClient students={transformedStudents} />;
}
