-- CreateTable
CREATE TABLE "AcademyCurrencyRate" (
    "id" SERIAL NOT NULL,
    "academyId" INTEGER NOT NULL,
    "currencyId" INTEGER NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademyCurrencyRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AcademyCurrencyRate_academyId_idx" ON "AcademyCurrencyRate"("academyId");

-- CreateIndex
CREATE UNIQUE INDEX "AcademyCurrencyRate_academyId_currencyId_key" ON "AcademyCurrencyRate"("academyId", "currencyId");

-- AddForeignKey
ALTER TABLE "AcademyCurrencyRate" ADD CONSTRAINT "AcademyCurrencyRate_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademyCurrencyRate" ADD CONSTRAINT "AcademyCurrencyRate_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
