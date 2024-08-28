/*
  Warnings:

  - A unique constraint covering the columns `[name,companyId]` on the table `Brand` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,name]` on the table `Category` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[productId,code]` on the table `ProductCodes` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,name]` on the table `Role` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,username]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `companyId` to the `Brand` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `Category` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `Concern` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `Role` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `Brand_name_key` ON `Brand`;

-- DropIndex
DROP INDEX `Category_name_key` ON `Category`;

-- DropIndex
DROP INDEX `ProductCodes_code_key` ON `ProductCodes`;

-- DropIndex
DROP INDEX `Role_name_key` ON `Role`;

-- DropIndex
DROP INDEX `User_username_key` ON `User`;

-- AlterTable
ALTER TABLE `Brand` ADD COLUMN `companyId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `Category` ADD COLUMN `companyId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `Concern` ADD COLUMN `companyId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `Product` ADD COLUMN `companyId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `Role` ADD COLUMN `companyId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `companyId` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `Company` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `ICE` VARCHAR(191) NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Company_name_key`(`name`),
    UNIQUE INDEX `Company_ICE_key`(`ICE`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Brand_name_companyId_key` ON `Brand`(`name`, `companyId`);

-- CreateIndex
CREATE UNIQUE INDEX `Category_companyId_name_key` ON `Category`(`companyId`, `name`);

-- CreateIndex
CREATE UNIQUE INDEX `ProductCodes_productId_code_key` ON `ProductCodes`(`productId`, `code`);

-- CreateIndex
CREATE UNIQUE INDEX `Role_companyId_name_key` ON `Role`(`companyId`, `name`);

-- CreateIndex
CREATE UNIQUE INDEX `User_companyId_username_key` ON `User`(`companyId`, `username`);

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Role` ADD CONSTRAINT `Role_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Category` ADD CONSTRAINT `Category_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Brand` ADD CONSTRAINT `Brand_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Concern` ADD CONSTRAINT `Concern_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
