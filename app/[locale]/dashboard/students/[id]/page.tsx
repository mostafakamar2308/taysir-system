import db from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import StudentProfileClient from "@/components/dashboard/studentProfile/viewer";
import { user } from "@/lib/auth";
import { getSessionStatus } from "@/lib/session";
import { StudentProfile, SessionRecord } from "@/types/studentProfile";
import { getStudentFinancialSummary } from "@/actions/studentFinances";
import dayjs from "@/lib/dayjs";

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const currentUser = await user();
  if (!currentUser || !currentUser.academyId) redirect("/login");

  const id = parseInt((await params).id);
  if (isNaN(id)) notFound();

  const student = await db.student.findUnique({
    where: { id },
    include: {
      user: true,
      currency: true,
      studentAvailabilities: true,
      notes: { include: { author: true }, orderBy: { createdAt: "desc" } },
      payments: { include: { currency: true } },
      // Active groups → currentTutor
      groupMemberships: {
        where: { active: true },
        include: {
          group: {
            include: {
              currentTutor: {
                include: { user: { select: { id: true, name: true } } },
              },
              _count: { select: { members: { where: { active: true } } } },
            },
          },
        },
      },
      sessionParticipants: {
        include: {
          session: {
            include: {
              group: {
                select: {
                  id: true,
                  title: true,
                  currentTutor: { include: { user: true } },
                },
              },
            },
          },
          report: true,
          homeworkSolutions: {
            take: 1,
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { session: { startTime: "desc" } },
      },
    },
  });

  if (!student) notFound();

  // Build groups array for profile header
  const groups = student.groupMemberships.map((m) => ({
    tutorId: m.group.currentTutor.id,
    tutorUserId: m.group.currentTutor.userId,
    tutorName: m.group.currentTutor.user.name ?? "غير معروف",
    isPrivate: m.group._count.members === 1,
  }));

  // Transform sessions – use group.currentTutor
  const sessions: SessionRecord[] = student.sessionParticipants.map((p) => {
    const solution = p.homeworkSolutions[0] ?? null;
    return {
      id: p.session.id,
      startTime: p.session.startTime.toISOString(),
      endTime: dayjs(p.session.startTime)
        .add(p.session.durationMinutes, "minute")
        .toISOString(),
      durationMinutes: p.session.durationMinutes,
      status: getSessionStatus(p.session),
      topic: p.session.topic,
      notes: p.session.notes,
      tutorId: p.session.group.currentTutor.id,
      tutorName: p.session.group.currentTutor.user.name ?? "",
      groupId: p.session.group.id,
      groupName: p.session.group.title,
      attendance: {
        id: p.id,
        status: p.studentAttendanceStatus,
        reason: p.reason ?? null,
      },
      report: p.report
        ? {
            id: p.report.id,
            rating: p.report.rating,
            outcomes: p.report.outcomes,
            strengths: p.report.strengths,
            weaknesses: p.report.weaknesses,
            nextGoals: p.report.nextGoals,
            comments: p.report.comments,
          }
        : null,
      homeworkSolution: solution
        ? {
            id: solution.id,
            score: solution.score,
            submittedAt: solution.submittedAt.toISOString(),
            gradedAt: solution.gradedAt?.toISOString() ?? null,
          }
        : null,
    };
  });

  const transformed: StudentProfile = {
    id: student.id,
    name: student.user.name || "",
    email: student.user.email || "",
    age: student.age,
    phone: student.user.phone || "",
    country: student.country,
    timezone: student.user.timezone,
    status: student.status,
    creditBalance: student.creditBalance,
    source: student.source,
    academyId: student.academyId,
    currencyId: student.currencyId,
    currencySymbol: student.currency.symbol,
    preferredLanguage: student.user.preferredLanguage,
    groups,
    notes: student.notes.map((n) => ({
      id: n.id,
      content: n.content,
      authorName: n.author.name ?? "مستخدم",
      createdAt: n.createdAt.toISOString(),
    })),
    payments: student.payments.map((p) => ({
      id: p.id,
      amount: p.amount,
      currency: p.currency.code,
      status: p.status,
      method: p.method,
      date: p.dueDate.toISOString(),
      dueDate: p.dueDate?.toISOString() ?? null,
      description: p.description,
      studentId: p.studentId,
      planId: p.planId,
      invoiceUrl: p.invoiceUrl,
    })),
    sessions,
  };

  const tutors = await db.tutor.findMany({
    where: { academyId: currentUser.academyId },
    include: { user: true },
  });

  let financialSummary = null;
  try {
    financialSummary = await getStudentFinancialSummary(id);
  } catch {
    financialSummary = null;
  }

  return (
    <StudentProfileClient
      tutors={tutors.map((t) => ({ id: t.id, name: t.user.name }))}
      student={transformed}
      financialSummary={financialSummary}
    />
  );
}
