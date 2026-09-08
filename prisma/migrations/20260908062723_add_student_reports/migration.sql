-- CreateTable
CREATE TABLE "StudentReport" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "academyId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "filePath" TEXT,
    "originalFileName" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "createdById" INTEGER NOT NULL,
    "updatedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudentReport_studentId_idx" ON "StudentReport"("studentId");

-- CreateIndex
CREATE INDEX "StudentReport_academyId_idx" ON "StudentReport"("academyId");

-- AddForeignKey
ALTER TABLE "StudentReport" ADD CONSTRAINT "StudentReport_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentReport" ADD CONSTRAINT "StudentReport_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentReport" ADD CONSTRAINT "StudentReport_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentReport" ADD CONSTRAINT "StudentReport_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
