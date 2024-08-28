const express = require('express');
const router = express.Router();
const { PrismaClient, Prisma } = require('@prisma/client');
const { authenticated, hasPermission, required } = require('./middlewares');
const prisma = new PrismaClient()
/** We using formidable & filesystem */
var bodyParser = require('body-parser')
const multer = require('multer');
const dayjs = require('dayjs');
var storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, './uploads');
  },
  filename: (req, file, callback) => {
    callback(null, `${Date.now()}-${file.originalname}`);
  }
});
var handleRequest = multer({ storage : storage }).any();

router.get(
  "/purchase/:id",
  [ multer({ storage : storage }).any(), authenticated, hasPermission('purchase-read') ],
  async (req, res) => {
    const purchaseId = parseFloat(req.params.id);
    /** Search Now */
    const purchase = await prisma.purchase.findFirst({ 
      where: { id: purchaseId },
      // include: { user: true, concern: { include: { _count: true, purchases: true } }, product: { include: { productCodes: true } }, documents: true, inventory: true } 
      include: {
        user: true,
        concern: { include: { _count: true, purchases: { include: { purchaseProducts: true } } } },
        purchaseProducts: { include: { inventories: true, product: { include: { productCodes: true } } } },
        documents: true
      }
    })
    purchase.concern.totalDF = 0;
    purchase.concern.totalPrice = 0;
    for (const cPurchase of purchase.concern.purchases) {
      cPurchase.totalDF = 0;
      cPurchase.totalPrice = 0;
      for (const purchaseProduct of cPurchase.purchaseProducts) {
        cPurchase.totalDF += parseFloat(purchaseProduct.price * purchaseProduct.quantity);
      }
      cPurchase.totalPrice = parseFloat(cPurchase.totalDF) + parseFloat(cPurchase.totalDF * cPurchase.vat / 100);;
      purchase.concern.totalDF += cPurchase.totalDF;
      purchase.concern.totalPrice += cPurchase.totalPrice;
    }

    return res.json(purchase)
  }
)

router.get(
  "/purchases",
  [ multer({ storage : storage }).any(), authenticated, hasPermission('purchase-read') ],
  async (req, res) => {
    // console.log(req.user);
    const { startDate, endDate } = req.query;
    const searchData = {};
    searchData.deleted = 0;
    searchData.company = { id: req.user.companyId }
    if ( req.query.concernId > 0 )
      searchData.concernId = parseInt(req.query.concernId)
    if ( req.query.productId > 0 )
      searchData.purchaseProducts = { some: { productId: parseInt(req.query.productId) } }
    // Date Filter
    if ( startDate )
      searchData.createdAt = { gte: dayjs(startDate).startOf('day').toDate() }
    if ( startDate ) {
      if ( searchData.createdAt )
        searchData.createdAt.lte = dayjs(endDate).endOf('day').toDate()
      else
        searchData.createdAt = { lte: dayjs(endDate).endOf('day').toDate() }
    }
    searchData.AND = {
      // A quotation has 0 purchase orders
      // which means purchase order id should be set to 0
      purchaseOrders: { every: { id: 0 } },
    }
    /** Search Now */
    const purchases = await prisma.purchase.findMany({ 
      where: searchData,
      include: {
        concern: { include: { _count: true, purchases: true } },
        purchaseProducts: { include: { inventories: true, product: true } },
        documents: true
      }
    })
    for (const purchase of purchases) {
      purchase.total = 0;
      purchase.totalPrice = 0;
      for (const purchaseProduct of purchase.purchaseProducts) {
        purchase.total += parseFloat(purchaseProduct.price) * parseFloat(purchaseProduct.quantity);
      }
      purchase.totalPrice = parseFloat(purchase.total) + parseFloat(purchase.total * purchase.vat / 100);
    }
    return res.json(purchases)
  }
)

router.post(
  "/purchase",
  [
    multer({ storage : storage }).any(),
    authenticated,
    hasPermission('purchase-create'),
    required(['concernId', 'products', 'vat', 'shipped'])
  ],
  async (req, res) => {
    /**
     * In this request we will be creating a purchase.
     * The purchase will contain one or more products.
     * Each Purchased product will have a specific price & and quantity.
     * Each purchased product will be added to the inventory.
    **/
    /** Inputs */
    const { concernId, products, vat } = req.body
    const purchaseData = {};
    purchaseData.concern = { connect: { id: parseInt(concernId) } };
    purchaseData.vat = parseFloat(vat);
    purchaseData.shipped = 1;
    purchaseData.deleted = 0;
    purchaseData.user = { connect: { id: parseInt(req.user.id) } };
    purchaseData.company = { connect: { id: req.user.companyId } };
    // console.log('Purchase Data', purchaseData);
    // console.log('Request Headers', req.headers);
    // console.log('User', req.user);
    // Create PurchaseRequest Headers
    const purchase = await prisma.purchase.create({ data: purchaseData })
    /** Create Purchase Products */
    let purchaseProducts = [];
    for (const product of JSON.parse(products)) {
      product.productId = parseFloat(product.productId)
      product.price = parseFloat(product.price)
      product.quantity = parseFloat(product.quantity)
      product.purchaseId = purchase.id
      purchaseProducts.push(
        await prisma.purchaseProduct.create({ data: product, include: { product: true }})
      )
    }
    /** Create an inventory out of the purchase product */
    for (const purchaseProduct of purchaseProducts) {
      await prisma.inventory.create({
        data: {
          ref: purchaseProduct.id + '' + Date.now(),
          product: { connect: { id: purchaseProduct.product.id } },
          purchaseProduct: { connect: { id: purchaseProduct.id } },
          price: purchaseProduct.product.sell_price,
          quantity: purchaseProduct.quantity,
        }
      })
    }
    /** If the purchase has documents */
    const files = req.files;
    for (let i = 0; i < files.length; i++) {
      await prisma.purchaseDocument.create({
        data: {
          name: files[i].originalname,
          file: files[i].filename,
          purchaseId: purchase.id
        }
      })
    }
    
    return res.json('Created')
  }
)

router.put(
  "/purchase/:id",
  [
    multer({ storage : storage }).any(),
    authenticated,
    hasPermission('purchase-update'),
    required(['concernId', 'products', 'vat', 'shipped'])
  ],
  async (req, res) => {
    const purchaseId = parseInt(req.params.id);
    const { concernId, products, vat, shipped } = req.body
    const purchaseData = {};
    purchaseData.concern = { connect: { id: parseInt(concernId) } };
    purchaseData.vat = parseFloat(vat);
    purchaseData.shipped = parseFloat(shipped);
    purchaseData.deleted = 0;
    purchaseData.user = { connect: { id: parseInt(req.user.id) } };
    const purchase = await prisma.purchase.update({ where: { id: purchaseId }, data: purchaseData })
    /** If the purchase is shipped */
    let purchaseProducts = [];
    for (const product of JSON.parse(products)) {
      const ProductData = {};
      ProductData.productId = parseFloat(product.productId)
      ProductData.purchaseId = purchase.id
      ProductData.price = parseFloat(product.price)
      ProductData.quantity = parseFloat(product.quantity)
      if ( product.id )
        purchaseProducts.push(
          await prisma.purchaseProduct.update({ where: { id: product.id }, data: ProductData, include: { product: true }})
        )
      else
        purchaseProducts.push(
          await prisma.purchaseProduct.create({ data: ProductData, include: { product: true }})
        )
    }
    if ( shipped > 0 ) {
      for (const purchaseProduct of purchaseProducts) {
        var inventory = { id: -1 };
        if ( purchaseProduct.id )
          inventory = await prisma.inventory.findFirst({ where: { purchaseProductId: purchaseProduct.id } })
        if ( inventory.id > 0 )
          await prisma.inventory.update({
            where: { id: inventory.id },
            data: {
              ref: purchaseProduct.id + '' + Date.now(),
              product: { connect: { id: purchaseProduct.product.id } },
              purchaseProduct: { connect: { id: purchaseProduct.id } },
              price: purchaseProduct.product.sell_price,
              quantity: purchaseProduct.quantity,
            }
          })
        else {
          await prisma.inventory.create({
            data: {
              ref: purchaseProduct.id + '' + Date.now(),
              product: { connect: { id: purchaseProduct.product.id } },
              purchaseProduct: { connect: { id: purchaseProduct.id } },
              price: purchaseProduct.product.sell_price,
              quantity: purchaseProduct.quantity,
            }
          })
        }
      }
    }
    /** If the purchase has documents */
    const files = req.files;
    for (let i = 0; i < files.length; i++) {
      await prisma.purchaseDocument.create({
        data: {
          name: files[i].originalname,
          file: files[i].filename,
          purchaseId: purchase.id
        }
      })
    }
    return res.json('Created')
  }
)

router.delete(
  "/purchase/:id",
  [
    authenticated,
    hasPermission('purchase-delete'),
  ],
  async (req, res) => {
    const purchaseId = parseInt(req.params.id);
    await prisma.purchase.update({
      where: { id: purchaseId },
      data: { deleted: 1 }
    });
    await prisma.inventory.update({
      where: { id: purchaseId },
      data: { deleted: 1 }
    })
  }
);

router.post(
  "/purchase/:id/purchaseOrder",
  [ multer({ storage : storage }).any(), authenticated, hasPermission('purchase-read') ],
  async (req, res) => {
    const purchaseId = parseFloat(req.params.id);
    const purchase = await prisma.purchase.findFirst({ 
      where: { id: purchaseId },
      include: { company: true, purchaseOrders: true }
    });
    if ( purchase.company.ICE != req.headers.company )
      return res.status(422).json('No access');
    if ( purchase.purchaseOrders.length > 0 )
      return res.status(422).json('Duplicated');
    /** Create now */
    const purchaseOrder = await prisma.purchasePurchaseOrder.create({
      data: {
        purchase: { connect: { id: purchase.id } }
      },
      include: { purchase: true }
    });
    return res.json(purchaseOrder);
  }
)

module.exports = router;