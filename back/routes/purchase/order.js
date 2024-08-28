const express = require('express');
const router = express.Router();
const { PrismaClient, UserLogMethods } = require('@prisma/client');
const { authenticated, hasPermission, required } = require('../middlewares');
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

/** Get All Orders */
router.get(
  "/purchase/orders",
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
      // An order has 0 purchase orders.
      // which means purchase order id should be set to 0.
      purchaseOrders: { every: { id: 0 } },
      // This is just an order (Commande). Cannot possibly have an inventory.
      // Which means inventories id should be set to 0.
      purchaseProducts: { every: { inventories: { every: { id: 0 } } } }
    }
    /** Search Now */
    const purchases = await prisma.purchase.findMany({ 
      where: searchData,
      include: {
        concern: { include: { _count: true, purchases: true } },
        purchaseProducts: { include: { inventories: true, product: true } },
        documents: true
      },
      orderBy: { createdAt: 'desc' }
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

/** Get specific order by ID */
router.get(
  "/purchase/order/:id",
  [ multer({ storage : storage }).any(), authenticated, hasPermission('purchase-read') ],
  async (req, res) => {
    const purchaseId = parseFloat(req.params.id);
    /** Search Now */
    const purchase = await prisma.purchase.findFirst({ 
      where: { id: purchaseId },
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

/** Create Order (With no inventory) */
router.post(
  "/purchase/order",
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
    // Create PurchaseRequest Headers
    const purchase = await prisma.purchase.create({ data: purchaseData });
    /** Create Purchase Products */
    let purchaseProducts = [];
    for (const product of JSON.parse(products)) {
      const createProduct = {};
      createProduct.productId = parseInt(product.productId)
      createProduct.price = parseFloat(product.price)
      createProduct.quantity = parseFloat(product.quantity)
      createProduct.purchaseId = purchase.id
      purchaseProducts.push(
        await prisma.purchaseProduct.create({ data: createProduct, include: { product: true }})
      );
      // Get the current price of the product and if the product price is lower than the order change its actual 
      // price to the inserted product price.
      const searchProduct = await prisma.product.findFirst({ where: { id: parseInt(product.productId) } });
      if ( createProduct.price > searchProduct.buy_price )
        await prisma.product.update({ where: { id: searchProduct.id }, data: { buy_price: parseFloat(createProduct.price) } });
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
      });
    }

    await prisma.userLog.create({ data: {
      method: UserLogMethods.CREATE,
      user: { connect: { id: parseInt(req.user.id) } },
      company: { connect: { id: parseInt(req.user.companyId) } },
      rowId: purchase.id,
      tableName: 'Order',
      newRow: JSON.stringify(purchase),
    }});

    const purchaseDocuments = await prisma.purchaseDocument.findMany({
      where: { purchase: { id: purchase.id } }
    });
    if ( purchaseDocuments.length > 0 ) {
      await prisma.userLog.create({ data: {
        method: UserLogMethods.CREATE,
        user: { connect: { id: parseInt(req.user.id) } },
        company: { connect: { id: parseInt(req.user.companyId) } },
        rowId: 0,
        tableName: 'PurchaseDocument',
        newRow: JSON.stringify(purchaseDocuments),
      }});
    }
    return res.json('Created')
  }
);

router.put(
  "/purchase/order/:id",
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
    const oldPurchase = await prisma.purchase.findFirst({ where: { id: purchaseId } })
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

    await prisma.userLog.create({ data: {
      method: UserLogMethods.UPDATE,
      user: { connect: { id: parseInt(req.user.id) } },
      company: { connect: { id: parseInt(req.user.companyId) } },
      rowId: purchase.id,
      tableName: 'Order',
      oldRow: JSON.stringify(oldPurchase),
      newRow: JSON.stringify(purchase),
    }});

    return res.json('Created')
  }
)

/** Create purchase order out of the Order */
router.post(
  "/purchase/order/:id/purchaseOrder",
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

    await prisma.userLog.create({ data: {
      method: UserLogMethods.CREATE,
      user: { connect: { id: parseInt(req.user.id) } },
      company: { connect: { id: parseInt(req.user.companyId) } },
      rowId: purchaseOrder.id,
      tableName: 'PurchasePurchaseOrder',
      newRow: JSON.stringify(purchaseOrder),
    }});
    return res.json(purchaseOrder);
  }
)

router.post(
  "/purchase/order/:id/purchase",
  [ multer({ storage : storage }).any(), authenticated, hasPermission('purchase-read') ],
  async (req, res) => {
    const purchaseId = parseFloat(req.params.id);
    const purchase = await prisma.purchase.findFirst({ 
      where: { id: purchaseId },
      include: { company: true, purchaseOrders: true, purchaseProducts: { include: { product: true } } }
    });
    if ( purchase.company.ICE != req.headers.company )
      return res.status(422).json('No access');
    /** Create an inventory out of the purchase */
    for (const purchaseProduct of purchase.purchaseProducts) {
      await prisma.inventory.create({
        data: {
          ref: purchaseProduct.id + '' + Date.now(),
          product: { connect: { id: purchaseProduct.product.id } },
          purchaseProduct: { connect: { id: purchaseProduct.id } },
          price: purchaseProduct.price,
          quantity: purchaseProduct.quantity,
        }
      })
    }
    const inventories = await prisma.inventory.findMany({
      where: { purchaseProduct: { purchaseId: purchase.id } }
    });

    await prisma.userLog.create({ data: {
      method: UserLogMethods.CREATE,
      user: { connect: { id: parseInt(req.user.id) } },
      company: { connect: { id: parseInt(req.user.companyId) } },
      rowId: 0,
      tableName: 'Inventories',
      newRow: JSON.stringify(inventories),
    }});

    await prisma.userLog.create({ data: {
      method: UserLogMethods.CREATE,
      user: { connect: { id: parseInt(req.user.id) } },
      company: { connect: { id: parseInt(req.user.companyId) } },
      rowId: purchase.id,
      tableName: 'Purchase',
      newRow: JSON.stringify(purchase),
    }});
    return res.json(purchase);
  }
)

router.delete(
  "/purchase/order/:id/",
  [ authenticated, hasPermission('purchase-delete') ],
  async (req, res) => {
    const purchase = await prisma.purchase.findFirst({ 
      where: { id: parseInt(req.params.id) },
      include: { purchaseOrders: true, purchaseProducts: { include: { inventories: true } } }
    });
    if ( purchase.purchaseProducts.length >= 0 || purchase.purchaseProducts[0]?.inventories?.length < 0 ) {
      await prisma.userLog.create({ 
        data: {
          method: UserLogMethods.DELETE,
          user: { connect: { id: parseInt(req.user.id) } },
          company: { connect: { id: parseInt(req.user.companyId) } },
          rowId: purchase.id,
          tableName: 'Order',
          oldRow: JSON.stringify(purchase),
        }
      });
      await prisma.purchaseProduct.deleteMany({ where: { purchaseId: purchase.id } });
      await prisma.purchase.delete({ where: { id: purchase.id } });
      return res.json('Deleted');
    }
    return res.status(422).json('This is not an Order');
  }
)

module.exports = router;