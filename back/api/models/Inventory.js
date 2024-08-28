// models/Inventory.js
// models/Company.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class Inventory {
  // static getAllMovements = async (companyId, condition) => {
  //   condition = { companyId: parseInt(companyId), ...condition }
  //   const products = await prisma.product.findMany({
  //     where: condition,
  //     include: {
  //       productCodes: { orderBy: { id: 'asc' } },
  //       inventories: {
  //         include: {
  //           purchaseProduct: { select: { purchase: { select: { concernId:  } } } },
  //           refundOperations: true
  //         }
  //       },
  //       saleProducts: { include: { InventoryOperations: true } },
  //       purchaseProducts: true,
  //     }
  //   });
  // }
  
  static getAllMovements = async (companyId, categoryId, brandId, concernId, searchTerm, startDate, endDate) => {

    // condition = { companyId: parseInt(companyId), ...condition }
    const products = await prisma.product.findMany({
      where: {
        ...(companyId && { companyId: parseInt(companyId) }),
        ...(categoryId && { categoryId: parseInt(categoryId) }),
        ...(brandId && { brandId: parseInt(brandId) }),
        ...(searchTerm && { productCodes : { some: { code: { contains: searchTerm } } } }),
        ...(concernId && { purchaseProducts: { some: { purchase: { concernId: parseInt(concernId) } } } }),
      },
      include: {
        productCodes: { orderBy: { id: 'asc' } },
        inventories: {
          ...((startDate || endDate) && 
            {
              where: {
                createdAt: {
                  ...(startDate && { gte: startDate }),
                  ...(endDate && { lte: endDate }),
                }
              }
            }
          ),
          // ...(concernId && { where: { purchaseProduct: { purchase: { concernId: parseInt(concernId) } } } }),
          include: {
            purchaseProduct: true,
            refundOperations: {
              ...((startDate || endDate) && 
                {
                  where: {
                    createdAt: {
                      ...(startDate && { gte: startDate }),
                      ...(endDate && { lte: endDate }),
                    }
                  }
                }
              )
            }
          }
        },
        saleProducts: {
          where: { sale: { deliveryForms: { some: {
            id: { gt: 0 },
            ...((startDate || endDate) && 
              {
                createdAt: {
                  ...(startDate && { gte: startDate }),
                  ...(endDate && { lte: endDate }),
                }
              }
            )
          } } } },
          include: { InventoryOperations: {
            ...((startDate || endDate) && 
              {
                where: {
                  createdAt: {
                    ...(startDate && { gte: startDate }),
                    ...(endDate && { lte: endDate }),
                  }
                }
              }
            )
          } } 
        },
        purchaseProducts: {
          ...((startDate || endDate) && 
            {
              where: {
                createdAt: {
                  ...(startDate && { gte: startDate }),
                  ...(endDate && { lte: endDate }),
                }
              }
            }
          )
        },
      }
    });
    return products;
  }

  static getAllMovementsByProductId = async (productId) => {
    const product = await prisma.product.findFirst({
      where: { id: parseInt(productId) },
      include: {
        productCodes: { orderBy: { id: 'asc' } },
        inventories: {
          include: {
            purchaseProduct: true,
            refundOperations: true
          }
        },
        saleProducts: {
          where: { sale: { deliveryForms: { some: { id: { gt: 0 } } } } },
          include: { InventoryOperations: true } 
        },
        purchaseProducts: true,
      }
    });
    return product;
  }
}

module.exports = Inventory;