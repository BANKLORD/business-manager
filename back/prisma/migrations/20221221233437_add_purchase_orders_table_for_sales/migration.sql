-- CreateTable
CREATE TABLE `SalePurchaseOrder` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `saleId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `SalePurchaseOrder_saleId_key`(`saleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SalePurchaseOrderDocument` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NULL,
    `file` VARCHAR(191) NOT NULL,
    `salePurchaseOrderId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SalePurchaseOrderDocument_salePurchaseOrderId_fkey`(`salePurchaseOrderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SalePurchaseOrder` ADD CONSTRAINT `SalePurchaseOrder_saleId_fkey` FOREIGN KEY (`saleId`) REFERENCES `Sale`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SalePurchaseOrderDocument` ADD CONSTRAINT `SalePurchaseOrderDocument_salePurchaseOrderId_fkey` FOREIGN KEY (`salePurchaseOrderId`) REFERENCES `SalePurchaseOrder`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
