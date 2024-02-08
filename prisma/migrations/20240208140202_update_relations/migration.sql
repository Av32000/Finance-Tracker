/*
  Warnings:

  - Added the required column `tagId` to the `TransactionTag` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "TransactionTag" DROP CONSTRAINT "TransactionTag_id_fkey";

-- AlterTable
ALTER TABLE "TransactionTag" ADD COLUMN     "tagId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "TransactionTag" ADD CONSTRAINT "TransactionTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
