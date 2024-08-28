const express = require('express');
const router = express.Router();
const { PrismaClient, Prisma } = require('@prisma/client');
const { authenticated, hasPermission, required } = require('./middlewares');
const prisma = new PrismaClient()

// router.get(
//   "/ez",
//   async ( req, res ) => {
//     const inventory = await prisma.inventory.findMany({
//       include: { sales: { distinct: 'inventoryId' } },
//     });
//     return res.json(inventory)
//   }
// )

router.get(
  "/inventories",
  [ authenticated, hasPermission('inventory-read') ],
  async ( req, res ) => {
    const { searchTerm, searchProduct, searchCategory, productId } = req.query;
    let whereQueryBuilder = {};
    if ( productId )
      whereQueryBuilder.productId = parseInt(productId);
    if ( searchProduct )
      whereQueryBuilder.productId = parseInt(searchProduct);
    if ( searchTerm )
      whereQueryBuilder.ref = { contains: searchTerm }
    if ( searchCategory > 0 )
      whereQueryBuilder.product = { categoryId: parseInt(searchCategory) }
    /** Search now */
    const inventories = await prisma.inventory.findMany({
      include: { product: { include: { productCodes: true } }, inventoryOperations: true },
      where: whereQueryBuilder,
      orderBy: { createdAt: 'asc' },
    });
    /** The rest of quantity */
    // for (const inventory of inventories) {
    //   inventory.restQuantity = inventory.quantity;
    //   const refundOperations = await prisma.refundOperation.findMany({
    //     where: { inventory: { id: inventory.id } },
    //   });
    //   for (const operation of inventory.inventoryOperations) {
    //     inventory.restQuantity -= operation.quantity;
    //     for (const refundOperation of refundOperations) {
    //       inventory.restQuantity += refundOperation.quantity;
    //     }
    //   }
    // }
    /** Code with less complexity */
    const inventoryIds = inventories.map((inventory) => inventory.id);
    const refundOperations = await prisma.refundOperation.findMany({
      where: { inventory: { id: { in: inventoryIds } } },
    });

    for (const inventory of inventories) {
      inventory.restQuantity = inventory.quantity;
      for (const operation of inventory.inventoryOperations) {
        inventory.restQuantity -= operation.quantity;
      }
      const refundOpsForInventory = refundOperations.filter(
        (refundOp) => refundOp.inventoryId === inventory.id
      );
      for (const refundOp of refundOpsForInventory) {
        inventory.restQuantity += refundOp.quantity;
      }
    }
    
    return res.json(inventories)
  }
)

router.post(
  "/inventory",
  [ authenticated, hasPermission('inventory-create') ],
  async ( req, res ) => {
    return res.status(422).json('Disabled')
  }
)

router.put(
  "/inventory/:id",
  [ authenticated, hasPermission('inventory-update') ],
  async ( req, res ) => {
    return res.status(422).json('Disabled')
  }
)

router.delete(
  "/inventory/:id",
  [ authenticated, hasPermission('inventory-delete') ],
  async ( req, res ) => {
    return res.status(422).json('Disabled')
  }
)

module.exports = router;