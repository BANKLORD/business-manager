-- AlterTable
ALTER TABLE `Sale` ADD COLUMN `saleType` ENUM('SERVICE', 'RETAIL', 'WHOLESALE', 'MANUFACTURING') NOT NULL DEFAULT 'RETAIL';
