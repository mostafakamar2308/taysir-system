-- CreateTable
CREATE TABLE "History" (
    "id" SERIAL NOT NULL,
    "targetType" INTEGER NOT NULL,
    "targetId" INTEGER NOT NULL,
    "action" INTEGER NOT NULL,
    "changes" JSONB,
    "recordedBy" INTEGER NOT NULL,
    "recorderType" INTEGER NOT NULL,
    "academyId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "History_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "History_targetType_targetId_idx" ON "History"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "History_action_idx" ON "History"("action");

-- AddForeignKey
ALTER TABLE "History" ADD CONSTRAINT "History_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
