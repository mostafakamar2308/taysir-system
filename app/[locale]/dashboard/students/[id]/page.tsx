import db from "@/lib/prisma";
import { notFound } from "next/navigation";
import StudentProfileClient from "@/components/dashboard/studentProfile/viewer";
import { StudentProfile } from "@/components/dashboard/studentProfile/viewer";

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = parseInt((await params).id);
  console.log({ id });
  if (isNaN(id)) notFound();

  const student = await db.student.findUnique({
    where: { id },
    include: {
      tutor: { include: { user: true } },
      plan: true,
      studentAvailabilities: true,
      notes: {
        include: { author: true },
        orderBy: { createdAt: "desc" },
      },
      payments: true,
      sessions: {
        include: {
          tutor: { include: { user: true } },
          attendance: true,
        },
        orderBy: { startTime: "desc" },
      },
    },
  });

  if (!student) notFound();

  // Transform data to match the client's expected shape
  const transformed: StudentProfile = {
    id: student.id,
    name: student.name,
    email: student.email,
    age: student.age,
    phone: student.phone,
    country: student.country,
    timezone: student.timezone,
    status: student.status,
    startDate: student.startDate.toISOString(),
    renewalDate: student.renewalDate?.toISOString() ?? null,
    source: student.source,
    currentProgram: student.currentProgram,
    emergencyContactName: student.emergencyContactName,
    emergencyContactPhone: student.emergencyContactPhone,
    preferredLanguage: student.preferredLanguage,
    profilePicture: student.profilePicture,
    tutorId: student.tutorId,
    tutorName: student.tutor?.user.name ?? null,
    planId: student.planId,
    plan: student.plan
      ? {
          id: student.plan.id,
          title: student.plan.title,
          sessionsPerWeek: student.plan.sessionsPerWeek,
          price: student.plan.price,
          billingPeriod: student.plan.billingPeriod,
        }
      : null,
    availabilities: student.studentAvailabilities.map((a) => ({
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
    })),
    notes: student.notes.map((n) => ({
      id: n.id,
      content: n.content,
      authorName: n.author.name ?? "مستخدم",
      createdAt: n.createdAt.toISOString(),
    })),
    payments: student.payments.map((p) => ({
      id: p.id,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      method: p.method,
      date: p.date.toISOString(),
      dueDate: p.dueDate?.toISOString() ?? null,
      description: p.description,
      studentId: p.studentId,
      planId: p.planId,
      invoiceUrl: p.invoiceUrl,
    })),
    sessions: student.sessions.map((s) => ({
      id: s.id,
      startTime: s.startTime.toISOString(),
      endTime: s.endTime.toISOString(),
      durationMinutes: s.durationMinutes,
      status: s.status,
      topic: s.topic,
      notes: s.notes,
      studentId: s.studentId,
      studentName: student.name, // or fetch student name if needed
      tutorId: s.tutorId,
      tutorName: s.tutor.user.name,
      attendance: s.attendance
        ? {
            id: s.attendance.id,
            status: s.attendance.status,
            reason: s.attendance.reason,
          }
        : undefined,
      recurringPatternId: s.recurringPatternId,
    })),
  };

  const plans = await db.plan.findMany();

  return <StudentProfileClient plans={plans} student={transformed} />;
}
