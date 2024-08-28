const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticated, hasPermission, required } = require('../middlewares');
const dayjs = require('dayjs');
const prisma = new PrismaClient()

/**
 * Using the formidable and filesystem modules in this project because they provide useful functions
 * for parsing form data and accessing the file system, respectively. These tools are particularly useful
 * for handling file uploads and other forms of user input
**/
require('body-parser')
const multer = require('multer');
var storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, './uploads');
  },
  filename: (req, file, callback) => {
    callback(null, `${Date.now()}-${file.originalname}`);
  }
});
var handleRequest = multer({ storage : storage }).any();

/**
 * To ensure code clarity and readability, please place all GET requests below this comment.
 * Thank you for your attention to this matter.
**/

// This section of code retrieves all purchase orders.
router.get( '/purchase/purchaseOrders',
  [ authenticated, hasPermission('purchase-read') ],
  async (req, res) => {
    const { startDate, endDate, concernId, productId } = req.query
    const whereQuery = { company: { ICE: req.headers.company } }
    whereQuery.deleted = 0;
    if ( concernId > 0 )
      whereQuery.concernId = parseInt(concernId)
    if ( productId > 0 )
      whereQuery.purchaseProducts = { some: { productId: parseInt(productId) } }
    // Date Filter
    if ( startDate )
      whereQuery.createdAt = { gte: dayjs(startDate).startOf('day').toDate() }
    if ( startDate ) {
      if ( whereQuery.createdAt )
        whereQuery.createdAt.lte = dayjs(endDate).endOf('day').toDate()
      else
        whereQuery.createdAt = { lte: dayjs(endDate).endOf('day').toDate() }
    }
    whereQuery.AND = {
      // A purchase order is a purchase with purchase order with ID which is greater than 0
      // which means that we are looking for some..
      // purchase orders with an ID that is absolutely greater than 0
      purchaseOrders: { some: { id: { gt: 0 } } },
      // This is just an order (Commande). Cannot possibly have an inventory.
      // Which means inventories id should be set to 0.
      purchaseProducts: { every: { inventories: { every: { id: 0 } } } }
    }
    const purchases = await prisma.purchase.findMany({
      include: {
        purchaseOrders: true,
        purchaseProducts: {
          include: {
            product: {
              include: { productCodes: { orderBy: { id: 'asc' } } }
            }
          }
        },
        concern: true
      },
      where: whereQuery,
      orderBy: {
        createdAt: 'desc'
      }
    })

    for (const purchase of purchases) {
      purchase.count = await prisma.purchasePurchaseOrder.count({
        where: { 
          id: { lte: purchase.purchaseOrders[0]?.id },
          purchase: { 
            company: { ICE: req.headers.company }
          }
        }
      });
      purchase.total = 0;
      purchase.total -= parseFloat(purchase.discount ?? 0)
      for (const purchaseProduct of purchase.purchaseProducts) {
        purchase.total += parseFloat(purchaseProduct.price) * parseFloat(purchaseProduct.quantity);
      }
      purchase.totalPrice = purchase.total + ( parseFloat(purchase.total) * (parseFloat(purchase.vat)) / 100 )
      purchase.rest = parseFloat(purchase.totalPrice) - parseFloat(purchase.paid);
    }
    return res.status(200).json(purchases);
  }
);
// This code retrieves a specific purchase order based on its ID.
router.get( '/purchase/purchaseOrder/:id',
  [ authenticated, hasPermission('purchase-read') ],
  async (req, res) => {
    const whereQuery = { company: { ICE: req.headers.company } }
    const purchaseId = parseInt(req.params.id);
    whereQuery.deleted = 0;
    whereQuery.id = purchaseId;
    const purchase = await prisma.purchase.findFirst({
      include: {
        purchaseProducts: {
          include: {
            product: {
              include: { productCodes: { orderBy: { id: 'asc' } } }
            }
          }
        },
        purchaseOrders: true,
        concern: true
      },
      where: whereQuery,
    })
    
    purchase.total = 0;
    purchase.total -= parseFloat(purchase.discount ?? 0)
    for (const purchaseProduct of purchase.purchaseProducts) {
      purchase.total += parseFloat(purchaseProduct.price) * parseFloat(purchaseProduct.quantity);
    }
    purchase.totalPrice = purchase.total + ( parseFloat(purchase.total) * (parseFloat(purchase.vat)) / 100 )
    
    purchase.count = await prisma.purchasePurchaseOrder.count({
      where: { 
        id: { lte: purchase.id },
        purchase: { company: { ICE: req.headers.company } }
      }
    });
    return res.status(200).json(purchase);
  }
);

/**
 * For the sake of code clarity and readability, all POST requests should be written below this comment.
 * Thank you for your attention to this matter
**/

// This code is used to create a purchase order.
router.post( "/purchase/purchaseOrder",
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
      product.productId = parseFloat(product.productId)
      product.price = parseFloat(product.price)
      product.quantity = parseFloat(product.quantity)
      product.purchaseId = purchase.id
      purchaseProducts.push(
        await prisma.purchaseProduct.create({ data: product, include: { product: true }})
      );
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
    /** Create a purchase order */
    const purchaseOrder = await prisma.purchasePurchaseOrder.create({
      data: {
        purchase: { connect: { id: purchase.id } }
      },
      include: { purchase: true }
    });
    return res.json(purchaseOrder)
  }
);

router.delete(
  "/purchase/purchaseOrder/:id",
  [
    authenticated,
    hasPermission('purchase-delete'),
  ],
  async (req, res) => {
    return res.status(422).json('Disabled');
    // const purchaseOrderId = parseInt(req.params.id);
    // await prisma.purchasePurchaseOrder.delete({
    //   where: { id: purchaseOrderId }
    // });
  }
);


router.post( "/purchase/purchaseOrder/:id/purchase",
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
    return res.json(purchase);
  }
)
module.exports = router;