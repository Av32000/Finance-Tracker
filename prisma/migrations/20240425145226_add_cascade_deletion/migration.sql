-- DropForeignKey
ALTER TABLE "Chart" DROP CONSTRAINT "Chart_chartId_fkey";

-- DropForeignKey
ALTER TABLE "Setting" DROP CONSTRAINT "Setting_settingId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_transactionId_fkey";

-- DropForeignKey
ALTER TABLE "TransactionTag" DROP CONSTRAINT "TransactionTag_tagId_fkey";

-- AddForeignKey
ALTER TABLE "Setting" ADD CONSTRAINT "Setting_settingId_fkey" FOREIGN KEY ("settingId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionTag" ADD CONSTRAINT "TransactionTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chart" ADD CONSTRAINT "Chart_chartId_fkey" FOREIGN KEY ("chartId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
