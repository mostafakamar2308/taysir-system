import { Prisma } from "@/generated/prisma/client";
import db from "@/lib/prisma";

/**
 * Add sessions to a student's balance when a payment is marked PAID.
 * Must be called inside a transaction, pass the tx client.
 */
export async function addSessionsFromPayment(
  paymentId: number,
  tx: Prisma.TransactionClient = db,
) {
  const payment = await tx.revenue.findUnique({
    where: { id: paymentId },
    include: {
      subscription: {
        select: { planPrice: true, sessionsPerPeriod: true },
      },
    },
  });

  if (!payment || payment.status !== 1) return; // only PAID
  if (!payment.subscription) return; // safety

  const { planPrice, sessionsPerPeriod } = payment.subscription;
  if (sessionsPerPeriod <= 0 || planPrice <= 0) return;

  const pricePerSession = planPrice / sessionsPerPeriod;
  const sessionsToAdd = Math.floor(payment.amount / pricePerSession);

  if (sessionsToAdd > 0) {
    await tx.student.update({
      where: { id: payment.studentId },
      data: { sessionsBalance: { increment: sessionsToAdd } },
    });
  }
}

/**
 * Deduct one session from a student's balance.
 */
export async function decrementBalance(
  studentId: number,
  tx: Prisma.TransactionClient = db,
) {
  await tx.student.update({
    where: { id: studentId },
    data: { sessionsBalance: { decrement: 1 } },
  });
}

/**
 * Return one session to a student's balance (cancellation/deletion).
 */
export async function incrementBalance(
  studentId: number,
  tx: Prisma.TransactionClient = db,
) {
  await tx.student.update({
    where: { id: studentId },
    data: { sessionsBalance: { increment: 1 } },
  });
}
