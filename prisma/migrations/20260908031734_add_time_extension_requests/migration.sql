-- CreateTable
CREATE TABLE "TimeExtensionRequest" (
    "id" SERIAL NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "requestedById" INTEGER NOT NULL,
    "addedMinutes" INTEGER NOT NULL,
    "requestedEndTime" TIMESTAMP(3) NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 0,
    "decidedById" INTEGER,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimeExtensionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TimeExtensionRequest_sessionId_idx" ON "TimeExtensionRequest"("sessionId");

-- CreateIndex
CREATE INDEX "TimeExtensionRequest_status_idx" ON "TimeExtensionRequest"("status");

-- AddForeignKey
ALTER TABLE "TimeExtensionRequest" ADD CONSTRAINT "TimeExtensionRequest_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
