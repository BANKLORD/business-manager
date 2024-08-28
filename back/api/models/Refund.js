// models/Product.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class Refund {
  static getAll = async (companyId, whereQuery) => {
    const refunds = await prisma.refund.findMany({
      where: {
        deliveryForm: {
          sale: { companyId: parseInt(companyId) }
        },
        deleted: 0,
        AND: whereQuery
      },
      
      include: {
        refundOperations: true,
        deliveryForm: true,
      }
    });
    return refunds;
  }

  static findById = async (refundId, companyId) => {
    const refund = await prisma.refund.findFirst({
      where: { id: parseInt(refundId) },
      include: {
        refundOperations: true
      }
    });
    refund.count = await prisma.refund.count({
      where: {
        id: { lte: parseInt(refundId) },
        invoice: {
          deliveryForms: {
            some: {
              sale: { companyId: parseInt(companyId) }
            }
          }
        }  
      }
    });
    return refund;
  }

  static createRefund = async (refundData) => {
    const refund = { invoiceId: refundData.invoiceId };
    const refundOperations = refundData.refundOperations.map(refundOperation => ({
      quantity: parseFloat(refundOperation.quantity),
      saleProductId: parseInt(refundOperation.saleProductId),
      inventoryId: parseInt(refundOperation.inventoryId) || undefined
    }));
    
    return await prisma.refund.create({
      data: {
        ...refund,
        refundOperations: {
          createMany: { data: refundOperations }
        }
      }
    });
  }
}

module.exports = Refund;