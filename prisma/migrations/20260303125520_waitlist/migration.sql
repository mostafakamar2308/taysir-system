-- CreateTable
CREATE TABLE "Waitlist" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "academyName" TEXT NOT NULL,
    "academySize" TEXT,
    "currentMethod" TEXT,
    "reviewBonus" BOOLEAN NOT NULL DEFAULT false,
    "videoBonus" BOOLEAN NOT NULL DEFAULT false,
    "terms" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Waitlist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Waitlist_email_key" ON "Waitlist"("email");

-- CreateIndex
CREATE INDEX "Waitlist_academySize_idx" ON "Waitlist"("academySize");

-- CreateIndex
CREATE INDEX "Waitlist_id_idx" ON "Waitlist"("id");
