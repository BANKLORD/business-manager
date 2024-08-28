const express = require('express');
const router = express.Router();
const { PrismaClient, Prisma } = require('@prisma/client');
const { authenticated, hasPermission, required } = require('./middlewares');
const prisma = new PrismaClient()

router.get(
  "/productcodes",
  [authenticated, hasPermission('product-read')],
  async (req, res) => {
    const codes = await prisma.productCodes.findMany({ include: { product: true } });
    return res.json(codes)
  }
)

router.get(
  "/products",
  [authenticated, hasPermission('product-read')],
  async (req, res) => {
    console.log(req.user)
    const { searchTerm, brandId, categoryId, code } = req.query;
    let whereQueryBuilder = {};
    whereQueryBuilder.company = { ICE: req.headers.company }
    if ( searchTerm )
      whereQueryBuilder.productCodes = { some: { code: { contains: searchTerm } } }
    if ( brandId > 0 )
      whereQueryBuilder.brandId = parseInt(brandId)
    if ( categoryId > 0 )
      whereQueryBuilder.categoryId = parseInt(categoryId)
    if ( code )
      whereQueryBuilder.productCodes = { every: { code: code } }
    /** Search now */
    const products = await prisma.product.findMany({
      include: {
        inventories: { include: { inventoryOperations: true } },
        productCodes: {
          orderBy: { id: 'asc' }
        },
        category: true,
        brand: true
      },
      where: whereQueryBuilder
    });
    for (const product of products) {
      product.quantity = 0;
      for (const inventory of product.inventories) {
        product.quantity += parseFloat(inventory.quantity);
        for (const inventoryOperation of inventory.inventoryOperations) {
          product.quantity -= parseFloat(inventoryOperation.quantity);
        }
      }    
    }
    return res.json(products)
  }
);

router.get(
  '/product/:id/movements',
  [ authenticated, hasPermission('product-read') ],
  async (req, res) => {
    const productId = parseInt(req.params.id)
    const product = await prisma.product.findFirst({
      where: { id: productId },
      include: {
        productCodes: {
          orderBy: { id: 'asc' }
        },
        brand: true,
        category: true,
        saleProducts: {
          include: {
            sale: true,
            InventoryOperations: {
              include: {
                inventory: true,
              }
            }
          }
        },
        purchaseProducts: {
          include: {
            inventories: true,
            purchase: {
              include: {
                concern: true
              }
            }
          }
        },
      }
    })
    product.quantityPurchased = 0;
    product.totalPaid = 0;
    product.quantitySold = 0;
    product.totalSold = 0;
    product.inventories = [];
    for (const purchaseProduct of product.purchaseProducts) {
      if ( purchaseProduct.inventories.length > 0 ) {
        for (const inventory of purchaseProduct.inventories) {
          product.inventories.push(inventory);
        }
        product.quantityPurchased += parseFloat(purchaseProduct.quantity);
        product.totalPaid += parseFloat(purchaseProduct.price * purchaseProduct.quantity);
      } else {
        product.quantityPurchased += parseFloat(0);
        product.totalPaid += parseFloat(0);
      }
    }
    for (const saleProduct of product.saleProducts) {
      product.quantitySold += parseFloat(saleProduct.quantity);
      product.totalSold += parseFloat(saleProduct.price * saleProduct.quantity);
    }
    return res.json(product)
  }
)

router.post(
  "/product",
  [
    authenticated,
    hasPermission('product-create'),
    required(['codes', 'buy_price', 'wholesale_price', 'categoryId'])
  ],
  async (req, res) => {
    const { codes, buy_price, wholesale_price, retail_price, categoryId, brandId, description, unity, stockAlert } = req.body;
    let createProductQuery = {};
    // Check duplicated codes..
    var productCodesCount = 0;
    for (const pCode of codes) {
      const productCode = await prisma.productCodes.count({
        where: { code: pCode.code, product: { company: { ICE: req.headers.company } } }
      });

      if ( productCode ) productCodesCount++;
    }
    if ( productCodesCount )
      return res.status(422).json("Le code que vous essayez d'insérer existe déjà dans les enregistrements");
    /** Mandatory fields doesn't need if/else */
    createProductQuery.category = { connect: { id: parseInt(categoryId) } };
    if ( buy_price )
      createProductQuery.buy_price = parseFloat(buy_price);
    if ( wholesale_price )
      createProductQuery.wholesale_price = parseFloat(wholesale_price) ? parseFloat(wholesale_price):0.00;
    if ( retail_price )
      createProductQuery.retail_price = parseFloat(retail_price) ? parseFloat(retail_price):0.00;
    if ( brandId > 0 )
      createProductQuery.brand = { connect: { id: parseInt(brandId) } };
    if ( description )
      createProductQuery.description = description;
    if ( unity )
      createProductQuery.unity = unity;
    if ( stockAlert )
      createProductQuery.stockAlert = parseFloat(stockAlert);
    createProductQuery.company = { connect: { ICE: req.headers.company } }
    /** Now we create the product */
    const product = await prisma.product.create({ data: createProductQuery })
    /** We do have one or two codes so its going to be a table */
    let createCodesQuery = [];
    for (let i = 0; i < codes.length; i++) {
      createCodesQuery.push({ productId: product.id, code: codes[i].code })      
    }
    await prisma.productCodes.createMany({
      data: createCodesQuery,
      skipDuplicates: true
    })
    return res.json([product])
  }
);

router.put(
  "/product/:id",
  [
    authenticated,
    hasPermission('product-update'),
    required(['codes', 'categoryId'])
  ],
  async (req, res) => {
    // if ( true ) {
    //   console.log(req.body);
    //   return res.status(422).json('Hello')
    // } 
    const { codes, buy_price, wholesale_price, retail_price, categoryId, brandId, description, unity, stockAlert } = req.body;
    const productId = parseInt(req.params.id)
    let dataQuery = {};
    dataQuery.category = { connect: { id: parseInt(categoryId) } };
    dataQuery.buy_price = parseFloat(buy_price) ? parseFloat(buy_price):0.00;
    dataQuery.wholesale_price = parseFloat(wholesale_price) ? parseFloat(wholesale_price):0.00;
    dataQuery.retail_price = parseFloat(retail_price) ? parseFloat(retail_price):0.00;
    dataQuery.stockAlert = parseFloat((stockAlert > 0) ? stockAlert:5);
    if ( unity )
      dataQuery.unity = unity
    if ( brandId ) 
      dataQuery.brand = { connect: { id: parseInt(brandId) } };
    if ( description ) 
      dataQuery.description = description;
    /** */
    await prisma.product.update({
      where: { id: productId },
      data: dataQuery,
    })
    await prisma.productCodes.deleteMany({
      where: {
        product: {
          id: productId
        }
      },
    })
    for (let i = 0; i < codes.length; i++) {
      // if ( codes[i].id )
      //   await prisma.productCodes.updateOr({
      //     where: { id: codes[i].id },
      //     data: { code: codes[i].code },
      //   })
      // else
      await prisma.productCodes.createMany({
        data: {
          productId: productId,
          code: codes[i].code,
        },
      })
    }
    return res.json('Updated Successfully')
  }
);

router.delete(
  "/products/:id",
  [authenticated, hasPermission('products-delete')],
  async (req, res) => {
    const productId = parseInt(req.params.id)
    /** Mark product as deleted */
    await prisma.product.updateMany({
      where: { id: productId },
      data: { deleted: 1 }
    });
    return res.json('product was deleted successfully')
  }
);

module.exports = router;