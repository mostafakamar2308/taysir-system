import db from "@/lib/prisma";
import FinancesClient from "@/components/dashboard/finances/viewer";
import { user } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@/types/user";
import { PaymentStatus } from "@/types/payment";
import { ExpenseRecord, PaymentRecord } from "@/types/finances";

export default async function FinancesPage() {
  const currentUser = await user();
  if (!currentUser || currentUser.role !== Role.Admin || !currentUser.academyId)
    redirect("/login");
  const { academyId } = currentUser;

  // Get academy's default currency
  const academy = await db.academy.findUnique({
    where: { id: academyId },
    include: { defaultCurrency: true },
  });
  if (!academy || !academy.defaultCurrency) {
    throw new Error("Academy default currency not set");
  }
  const defaultCurrency = academy.defaultCurrency;
  const defaultCurrencyId = defaultCurrency.id;

  // Get conversion rates for this academy
  const rates = await db.academyCurrencyRate.findMany({
    where: { academyId },
  });
  const rateMap = new Map<number, number>();
  rates.forEach((r) => rateMap.set(r.currencyId, r.rate));

  // Helper to convert amount to default currency
  const convertToDefault = (amount: number, currencyId: number): number => {
    if (currencyId === defaultCurrencyId) return amount;
    const rate = rateMap.get(currencyId);
    if (!rate) {
      console.warn(
        `No conversion rate found for currency ${currencyId}, using amount as is`,
      );
      return amount;
    }
    return amount * rate;
  };

  // Fetch all payments for this academy
  const payments = await db.revenue.findMany({
    where: { academyId },
    include: { student: { select: { name: true } }, currency: true },
    orderBy: { dueDate: "desc" },
  });

  // Fetch all expenses for this academy
  const expenses = await db.expense.findMany({
    where: { academyId },
    include: { tutor: { include: { user: true } }, currency: true },
    orderBy: { date: "desc" },
  });

  // Transform for client with converted amounts
  const transformedPayments: PaymentRecord[] = payments.map((p) => ({
    id: p.id,
    amount: p.amount,
    amountInDefault: convertToDefault(p.amount, p.currencyId),
    currency: p.currency.name,
    currencyCode: p.currency.code,
    status: p.status,
    method: p.method,
    date: p.dueDate.toISOString().split("T")[0],
    dueDate: p.dueDate?.toISOString().split("T")[0] || null,
    description: p.description,
    studentId: p.studentId,
    studentName: p.student.name,
    planId: p.planId,
    recordedBy: p.recordedBy,
    invoiceUrl: p.invoiceUrl,
    channel: p.channel,
    notes: p.notes,
    currencyId: p.currencyId,
  }));

  const transformedExpenses: ExpenseRecord[] = expenses.map((e) => ({
    id: e.id,
    date: e.date.toISOString().split("T")[0],
    description: e.description,
    costCenter: e.costCenter,
    amount: e.amount,
    amountInDefault: convertToDefault(e.amount, e.currencyId),
    currency: e.currency.name,
    currencyCode: e.currency.code,
    paymentMethod: e.method,
    paid: e.status === PaymentStatus.PAID,
    invoiceUrl: e.invoiceUrl,
    currencyId: e.currency.id,
    method: e.method,
    status: e.status,
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
  const plans = await db.plan.findMany({
    where: { academyId },
  });
  const currencies = await db.currency.findMany();

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
      currencies={currencies}
      defaultCurrency={{
        code: defaultCurrency.code,
        symbol: defaultCurrency.symbol,
        name: defaultCurrency.name,
      }}
    />
  );
}
