/*
  Warnings:

  - You are about to drop the column `backImageUrl` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `frontImageUrl` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `verificationApprovedAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `verificationNotes` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `verificationRejectedAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `verificationStatus` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `verificationSubmittedAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `verificationType` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Delivery" ADD COLUMN "deletedAt" DATETIME;

-- CreateTable
CREATE TABLE "IdDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "frontImagePath" TEXT,
    "backImagePath" TEXT,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "IdDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" DATETIME,
    "image" TEXT,
    "phone" TEXT,
    "phoneVerified" DATETIME,
    "countryCode" TEXT,
    "password" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "country" TEXT,
    "gender" TEXT,
    "dateOfBirth" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_User" ("country", "countryCode", "createdAt", "dateOfBirth", "email", "emailVerified", "gender", "id", "image", "isActive", "name", "password", "phone", "phoneVerified", "updatedAt") SELECT "country", "countryCode", "createdAt", "dateOfBirth", "email", "emailVerified", "gender", "id", "image", "isActive", "name", "password", "phone", "phoneVerified", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "IdDocument_userId_idx" ON "IdDocument"("userId");
