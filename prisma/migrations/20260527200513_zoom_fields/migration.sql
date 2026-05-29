-- AlterTable
ALTER TABLE "Tutor" ADD COLUMN     "zoomAccessToken" TEXT,
ADD COLUMN     "zoomRefreshToken" TEXT,
ADD COLUMN     "zoomTokenExpiry" TIMESTAMP(3),
ADD COLUMN     "zoomUserId" TEXT;
