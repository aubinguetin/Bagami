-- AlterTable
ALTER TABLE "User" ADD COLUMN "backImageUrl" TEXT;
ALTER TABLE "User" ADD COLUMN "frontImageUrl" TEXT;
ALTER TABLE "User" ADD COLUMN "verificationApprovedAt" DATETIME;
ALTER TABLE "User" ADD COLUMN "verificationNotes" TEXT;
ALTER TABLE "User" ADD COLUMN "verificationRejectedAt" DATETIME;
ALTER TABLE "User" ADD COLUMN "verificationStatus" TEXT DEFAULT 'unverified';
ALTER TABLE "User" ADD COLUMN "verificationSubmittedAt" DATETIME;
ALTER TABLE "User" ADD COLUMN "verificationType" TEXT;
