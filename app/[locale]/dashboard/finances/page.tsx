import db from "@/lib/prisma";
import FinancesClient from "@/components/dashboard/finances/viewer";

export default async function FinancesPage() {
  // TODO: Get academyId from session (hardcoded for now)
  const academy = await db.academy.findFirst({});
  const academyId = academy?.id;

  // Fetch all payments for this academy
  const payments = await db.payment.findMany({
    where: { student: { academyId } },
    include: { student: { select: { name: true } } },
    orderBy: { date: "desc" },
  });

  // Fetch all expenses for this academy
  const expenses = await db.expense.findMany({
    where: { academyId },
    include: { tutor: { include: { user: true } } },
    orderBy: { date: "desc" },
  });

  // Transform for client
  const transformedPayments = payments.map((p) => ({
    id: p.id,
    amount: p.amount,
    currency: p.currency,
    status: p.status,
    method: p.method,
    date: p.date.toISOString().split("T")[0],
    dueDate: p.dueDate?.toISOString().split("T")[0] || null,
    description: p.description,
    studentId: p.studentId,
    studentName: p.student.name,
    planId: p.planId,
    recordedBy: p.recordedBy,
    invoiceUrl: p.invoiceUrl,
    channel: p.channel,
    notes: p.notes,
  }));

  const transformedExpenses = expenses.map((e) => ({
    id: e.id,
    date: e.date.toISOString().split("T")[0],
    description: e.description,
    costCenter: e.costCenter,
    amount: e.amount,
    currency: e.currency,
    paymentMethod: e.paymentMethod,
    paid: e.paid,
    reference: e.reference,
    notes: e.notes,
    tutorId: e.tutorId,
    tutorName: e.tutor?.user.name || null,
    salaryMonth: e.salaryMonth,
  }));

  // Fetch options for dialogs
  const students = await db.student.findMany({
    where: { academyId },
    select: { id: true, name: true },
  });
  const tutors = await db.tutor.findMany({
    where: { academyId },
    include: { user: { select: { name: true } } },
  });
  const plans = await db.plan.findMany();

  const tutorOptions = tutors.map((t) => ({
    id: t.id,
    name: t.user.name ?? "",
  }));

  return (
    <FinancesClient
      initialPayments={transformedPayments}
      initialExpenses={transformedExpenses}
      academyId={academyId}
      students={students}
      tutors={tutorOptions}
      plans={plans}
    />
  );
}
