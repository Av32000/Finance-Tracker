/*
  Warnings:

  - You are about to drop the column `Chart` on the `Account` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Account" DROP COLUMN "Chart",
ADD COLUMN     "charts" JSONB[];
