-- CreateEnum
CREATE TYPE "AccountMemberRole" AS ENUM ('OWNER', 'MANAGER', 'MEMBER', 'VIEWER');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('CASH', 'CHECKING', 'SAVINGS', 'DIGITAL', 'INVESTMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AccountType" NOT NULL,
    "currency" TEXT NOT NULL,
    "initialBalance" DECIMAL(65,30) NOT NULL,
    "balance" DECIMAL(65,30) NOT NULL,
    "status" "AccountStatus" NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountMember" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "AccountMemberRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Account_status_idx" ON "Account"("status");

-- CreateIndex
CREATE INDEX "AccountMember_accountId_idx" ON "AccountMember"("accountId");

-- CreateIndex
CREATE INDEX "AccountMember_userId_idx" ON "AccountMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountMember_accountId_userId_key" ON "AccountMember"("accountId", "userId");

-- AddForeignKey
ALTER TABLE "AccountMember" ADD CONSTRAINT "AccountMember_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountMember" ADD CONSTRAINT "AccountMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
