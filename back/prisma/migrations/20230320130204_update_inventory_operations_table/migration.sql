-- DropForeignKey
ALTER TABLE `InventoryOperation` DROP FOREIGN KEY `InventoryOperation_inventoryId_fkey`;

-- AlterTable
ALTER TABLE `InventoryOperation` MODIFY `inventoryId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `InventoryOperation` ADD CONSTRAINT `InventoryOperation_inventoryId_fkey` FOREIGN KEY (`inventoryId`) REFERENCES `Inventory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
