/*
  Warnings:

  - You are about to alter the column `type` on the `SaleProduct` table. The data in that column could be lost. The data in that column will be cast from `Enum("SaleProduct_type")` to `Enum("SaleProduct_type")`.

*/
-- AlterTable
ALTER TABLE `SaleProduct` MODIFY `type` ENUM('retail', 'wholesale') NOT NULL DEFAULT 'retail';
