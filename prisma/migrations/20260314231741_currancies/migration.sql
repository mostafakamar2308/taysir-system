-- CreateTable
CREATE TABLE "Currency" (
    "id" SERIAL NOT NULL,
    "academyId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "exchangeRate" DOUBLE PRECISION NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Currency_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Currency_academyId_idx" ON "Currency"("academyId");

-- CreateIndex
CREATE UNIQUE INDEX "Currency_academyId_code_key" ON "Currency"("academyId", "code");

-- AddForeignKey
ALTER TABLE "Currency" ADD CONSTRAINT "Currency_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
