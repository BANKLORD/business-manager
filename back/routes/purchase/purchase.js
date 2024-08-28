const express = require('express');
const router = express.Router();
const { PrismaClient, UserLogMethods } = require('@prisma/client');
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
router.get( '/purchases',
  [ authenticated, hasPermission('purchase-read') ],
  async (req, res) => {
    const { startDate, endDate, concernId, productId } = req.query;
    const whereQuery = {
      deleted: 0,
      company: { ICE: req.headers.company },
      purchaseProducts: { every: { inventories: { some: { id: { gt: 0 } } } } },
      ...((concernId > 0) && { concernId: parseInt(concernId) }),
      ...((productId > 0) && { productId: parseInt(productId) }),
      ...((startDate || endDate) && {
        createdAt: {
          ...(startDate && { gte: dayjs(startDate).startOf('day').toDate() }),
          ...(endDate && { lte: dayjs(endDate).endOf('day').toDate() }),
        }
      }),
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
    });

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
router.get( '/purchase/:id',
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

// This code is used to create a purchase.
router.post( "/purchase",
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
      const createdPurchaseProduct = {
        price: parseFloat(product.price),
        productId: parseFloat(product.productId),
        quantity: parseFloat(product.quantity),
        purchaseId: parseFloat(purchase.id),
      };
      purchaseProducts.push(
        await prisma.purchaseProduct.create({ data: createdPurchaseProduct, include: { product: true }})
      );
    }
    /** Create an inventory out of the purchase product */
    for (const purchaseProduct of purchaseProducts) {
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

    await prisma.userLog.create({ 
      data: {
        method: UserLogMethods.CREATE,
        user: { connect: { id: parseInt(req.user.id) } },
        company: { connect: { id: parseInt(req.user.companyId) } },
        rowId: purchase.id,
        tableName: 'Purchase',
        newRow: JSON.stringify(purchase),
      }
    });
    return res.json(purchase);
  }
);

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
    purchaseData.shipped = parseInt(shipped);
    purchaseData.deleted = 0;
    purchaseData.user = { connect: { id: parseInt(req.user.id) } };
    const purchaseIncludes = { 
      purchaseOrders: true,
      purchaseProducts: { 
        include: {
          inventories: true
        }
      }
    }
    const oldPurchase = await prisma.purchase.findFirst({
      where: { id: purchaseId },
      include: purchaseIncludes
    });
    const purchase = await prisma.purchase.update({ where: { id: purchaseId }, data: purchaseData, include: purchaseIncludes })
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
          await prisma.purchaseProduct.update({ where: { id: product.id }, data: ProductData, include: { product: true, inventories: true }})
        )
      else
        purchaseProducts.push(
          await prisma.purchaseProduct.create({ data: ProductData, include: { product: true, inventories: true }})
        )
    }
    /** Create or Update an inventory out of the purchase product */
    for (const purchaseProduct of purchaseProducts) {
      if ( purchaseProduct.inventories.length > 0 ) {
        const inventoryToUpdate = await prisma.inventory.findFirst({ where: { purchaseProductId: purchaseProduct.id } });
        await prisma.inventory.update({
          where: { id: inventoryToUpdate.id },
          data: {
            ref: purchaseProduct.id + '' + Date.now(),
            product: { connect: { id: purchaseProduct.product.id } },
            purchaseProduct: { connect: { id: purchaseProduct.id } },
            price: purchaseProduct.price,
            quantity: purchaseProduct.quantity,
          }
        })
      } else {
        await prisma.inventory.create({
          data: {
            ref: purchaseProduct.id + '' + Date.now(),
            product: { connect: { id: purchaseProduct.product.id } },
            purchaseProduct: { connect: { id: purchaseProduct.id } },
            price: purchaseProduct.price,
            quantity: purchaseProduct.quantity,
          }
        });
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

    await prisma.userLog.create({ 
      data: {
        method: UserLogMethods.UPDATE,
        user: { connect: { id: parseInt(req.user.id) } },
        company: { connect: { id: parseInt(req.user.companyId) } },
        rowId: purchase.id,
        tableName: 'Purchase',
        oldRow: JSON.stringify(oldPurchase),
        newRow: JSON.stringify(purchase),
      }
    });
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
    return res.status(422).json('Disabled');
    // const purchaseOrderId = parseInt(req.params.id);
    // await prisma.purchasePurchaseOrder.delete({
    //   where: { id: purchaseOrderId }
    // });
  }
);

module.exports = router;