-- AlterTable
ALTER TABLE `SalePayment` ADD COLUMN `isFixedPayment` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `SalePaymentDocument` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `salePaymentId` INTEGER NOT NULL,
    `documentUrl` VARCHAR(191) NOT NULL,
    `mimetype` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SalePaymentDocument` ADD CONSTRAINT `SalePaymentDocument_salePaymentId_fkey` FOREIGN KEY (`salePaymentId`) REFERENCES `SalePayment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
