/*
  Warnings:

  - You are about to drop the column `saleId` on the `Invoice` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `Invoice` DROP FOREIGN KEY `Invoice_saleId_fkey`;

-- AlterTable
ALTER TABLE `DeliveryForm` ADD COLUMN `invoiceId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Invoice` DROP COLUMN `saleId`;

-- AddForeignKey
ALTER TABLE `DeliveryForm` ADD CONSTRAINT `DeliveryForm_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `Invoice`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
