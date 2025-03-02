/*
  Warnings:

  - You are about to drop the `Chart` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Chart" DROP CONSTRAINT "Chart_chartId_fkey";

-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "Chart" TEXT[];

-- DropTable
DROP TABLE "Chart";
