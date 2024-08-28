// models/Product.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class SaleProduct {
  static findById = async (id) => {
    return await prisma.saleProduct.findFirst({
      where: { id: parseInt(id) },
      include: { InventoryOperations: true, refundOperations: true }
    });
  }
}

module.exports = SaleProduct;
