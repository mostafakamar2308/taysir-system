-- CreateTable
CREATE TABLE "AcademySettings" (
    "id" SERIAL NOT NULL,
    "academyId" INTEGER NOT NULL,
    "tutorsCanCreateSessions" BOOLEAN NOT NULL DEFAULT true,
    "tutorsCanEditSessionTime" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademySettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AcademySettings_academyId_key" ON "AcademySettings"("academyId");

-- CreateIndex
CREATE INDEX "AcademySettings_academyId_idx" ON "AcademySettings"("academyId");

-- AddForeignKey
ALTER TABLE "AcademySettings" ADD CONSTRAINT "AcademySettings_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
