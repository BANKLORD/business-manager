-- DropForeignKey
ALTER TABLE `Refund` DROP FOREIGN KEY `Refund_deliveryFormId_fkey`;

-- AlterTable
ALTER TABLE `Refund` ADD COLUMN `invoiceId` INTEGER NULL,
    MODIFY `deliveryFormId` INTEGER NULL;

-- AlterTable
ALTER TABLE `RefundOperation` ADD COLUMN `saleProductId` INTEGER NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `name` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Refund` ADD CONSTRAINT `Refund_deliveryFormId_fkey` FOREIGN KEY (`deliveryFormId`) REFERENCES `DeliveryForm`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Refund` ADD CONSTRAINT `Refund_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `Invoice`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RefundOperation` ADD CONSTRAINT `RefundOperation_saleProductId_fkey` FOREIGN KEY (`saleProductId`) REFERENCES `SaleProduct`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
