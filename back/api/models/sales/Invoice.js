// models/Product.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class Invoice {
  static findById = async (id) => {
    const invoice = await prisma.invoice.findFirst({
      where: { id: parseInt(id) },
      include: {
        deliveryForms: {
          include: {
            refunds: true,
            sale: { include: { saleProducts: { include: { InventoryOperations: true, refundOperations: true } } } }
          },
        },
        refunds: {
          include: {
            refundOperations: {
              include: {
                saleProduct: {
                  include: {
                    product: {
                      include: { productCodes: true }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });
    invoice.count = await prisma.invoice.count({
      where: {
        id: { lte: invoice.id },
        deliveryForms: {
          some: {
            sale: { companyId: invoice.deliveryForms[0].sale.companyId }
          }
        }
      }
    });
    for (const refund of invoice.refunds) {
      refund.count = await prisma.refund.count({
        where: {
          id: { lte: refund.id },
          invoice: {
            deliveryForms: {
              some: {
                sale: { companyId: invoice.deliveryForms[0].sale.companyId }
              }
            }
          }  
        }
      });
    }
    return invoice;
  }

  createInvoice = () => {
    return this.id;
  }
}

module.exports = Invoice;
