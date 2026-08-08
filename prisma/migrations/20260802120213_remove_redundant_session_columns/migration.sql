/*
  Warnings:

  - You are about to drop the column `endTime` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `zoomJoinUrl` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `zoomMeetingId` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `zoomMeetingUuid` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `zoomStartUrl` on the `Session` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Session" DROP COLUMN "endTime",
DROP COLUMN "zoomJoinUrl",
DROP COLUMN "zoomMeetingId",
DROP COLUMN "zoomMeetingUuid",
DROP COLUMN "zoomStartUrl",
ADD COLUMN     "zoomUrl" TEXT;
