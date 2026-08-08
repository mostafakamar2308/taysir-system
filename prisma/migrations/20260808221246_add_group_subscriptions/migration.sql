-- AlterTable
ALTER TABLE "Revenue" ADD COLUMN     "subscriptionId" INTEGER;

-- CreateTable
CREATE TABLE "Subscription" (
    "id" SERIAL NOT NULL,
    "groupStudentId" INTEGER NOT NULL,
    "planId" INTEGER,
    "price" DOUBLE PRECISION NOT NULL,
    "currencyId" INTEGER NOT NULL,
    "sessionCount" INTEGER,
    "billingCycle" INTEGER NOT NULL DEFAULT 30,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "nextBillingDate" TIMESTAMP(3),
    "status" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Subscription_groupStudentId_idx" ON "Subscription"("groupStudentId");

-- CreateIndex
CREATE INDEX "Subscription_planId_idx" ON "Subscription"("planId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE INDEX "Revenue_subscriptionId_idx" ON "Revenue"("subscriptionId");

-- AddForeignKey
ALTER TABLE "Revenue" ADD CONSTRAINT "Revenue_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_groupStudentId_fkey" FOREIGN KEY ("groupStudentId") REFERENCES "GroupStudent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
