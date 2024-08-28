-- AlterTable
ALTER TABLE `SaleProduct` ADD COLUMN `type` ENUM('retail', 'wholesale') NOT NULL DEFAULT 'retail';
