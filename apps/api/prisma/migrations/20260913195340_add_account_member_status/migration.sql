-- CreateEnum
CREATE TYPE "AccountMemberStatus" AS ENUM ('ACTIVE', 'BLOCKED');

-- AlterTable
ALTER TABLE "AccountMember" ADD COLUMN     "status" "AccountMemberStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE INDEX "AccountMember_status_idx" ON "AccountMember"("status");
