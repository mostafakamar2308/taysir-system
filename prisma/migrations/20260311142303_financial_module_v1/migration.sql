-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "channel" TEXT,
ADD COLUMN     "notes" TEXT;

-- CreateTable
CREATE TABLE "Expense" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "costCenter" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EGP',
    "paymentMethod" INTEGER,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "reference" TEXT,
    "notes" TEXT,
    "tutorId" INTEGER,
    "salaryMonth" TEXT,
    "academyId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionReport" (
    "id" SERIAL NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "memorization" TEXT,
    "revision" TEXT,
    "tajweed" TEXT,
    "strengths" TEXT,
    "weaknesses" TEXT,
    "nextGoals" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Expense_academyId_idx" ON "Expense"("academyId");

-- CreateIndex
CREATE INDEX "Expense_tutorId_idx" ON "Expense"("tutorId");

-- CreateIndex
CREATE INDEX "Expense_date_idx" ON "Expense"("date");

-- CreateIndex
CREATE UNIQUE INDEX "SessionReport_sessionId_key" ON "SessionReport"("sessionId");

-- CreateIndex
CREATE INDEX "SessionReport_sessionId_idx" ON "SessionReport"("sessionId");

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "Tutor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionReport" ADD CONSTRAINT "SessionReport_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
