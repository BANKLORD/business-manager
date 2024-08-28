-- DropForeignKey
ALTER TABLE `RefundOperation` DROP FOREIGN KEY `RefundOperation_inventoryId_fkey`;

-- AlterTable
ALTER TABLE `RefundOperation` MODIFY `inventoryId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `RefundOperation` ADD CONSTRAINT `RefundOperation_inventoryId_fkey` FOREIGN KEY (`inventoryId`) REFERENCES `Inventory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
