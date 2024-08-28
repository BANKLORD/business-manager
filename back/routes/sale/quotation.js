const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient()
const { authenticated, hasPermission, required } = require('../middlewares');
const dayjs = require('dayjs');
/**
 * Multer stores the uploaded files in memory or on disk, and makes it easy to process and access the files in your Node.js application.
 * It can also be configured to handle different types of form data, such as text fields and checkboxes.
 */
const multer = require('multer');
var storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, './uploads');
  },
  filename: (req, file, callback) => {
    callback(null, `${Date.now()}-${file.originalname}`);
  }
});
multer({ storage : storage }).any();

// For the sake of code readability, all GET requests should be placed under this section

/**
 * This route retrieves all quotations, which includes all sales rows that do not have any associated purchase orders,
 * delivery forms, or inventory operations
**/
router.get( '/sale/quotations',
  [ authenticated, hasPermission('sale-read') ],
  async (req, res) => {
    const companySettings = await prisma.companySettings.findUnique({
      where: { companyId: req.user.companyId,},
    });
    
    const { startDate, endDate, concernId, productId } = req.query
    const whereQuery = { company: { ICE: req.headers.company } }
    whereQuery.deleted = 0;
    whereQuery.saleType = companySettings.industryType;
    if ( concernId > 0 )
      whereQuery.concernId = parseInt(concernId)
    if ( productId > 0 )
      whereQuery.saleProducts = { some: { productId: parseInt(productId) } }
    // Date Filter
    if ( !!!startDate )
      whereQuery.createdAt = { gte: dayjs(startDate).startOf('day').toDate() }
    if ( !!!endDate ) {
      if ( whereQuery.createdAt )
        whereQuery.createdAt.lte = dayjs(endDate).endOf('day').toDate()
      else
        whereQuery.createdAt = { lte: dayjs(endDate).endOf('day').toDate() }
    }
    whereQuery.AND = {
      // A quotation has 0 purchase orders
      // which means purchase order id should be set to 0
      purchaseOrders: { every: { id: 0 } },
      // A quotation has 0 delivery forms
      // which means delivery forms id should be set to 0
      deliveryForms: { every: { id: 0 } },
    }
    const sales = await prisma.sale.findMany({
      include: {
        saleProducts: {
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

    for (const sale of sales) {
      sale.total = 0;
      sale.total -= parseFloat(sale.discount ?? 0)
      for (const saleProduct of sale.saleProducts) {
        sale.total += parseFloat(saleProduct.price) * parseFloat(saleProduct.quantity);
      }
      sale.totalPrice = sale.total + ( parseFloat(sale.total) * (parseFloat(sale.vat)) / 100 )
      sale.rest = parseFloat(sale.totalPrice) - parseFloat(sale.paid);
    }
    return res.status(200).json(sales);
  }
);
// This route retrieves a specific quotation
router.get( '/sale/quotation/:id',
  [ authenticated, hasPermission('sale-read') ],
  async (req, res) => {
    const whereQuery = { company: { ICE: req.headers.company } }
    const quotationId = parseInt(req.params.id);
    whereQuery.deleted = 0;
    whereQuery.id = parseInt(quotationId);
    const sale = await prisma.sale.findFirst({
      include: {
        saleProducts: {
          include: {
            product: {
              include: { productCodes: { orderBy: { id: 'asc' } } }
            }
          }
        },
        concern: true
      },
      where: whereQuery,
    })
    
    sale.total = 0;
    sale.total -= parseFloat(sale.discount ?? 0)
    for (const saleProduct of sale.saleProducts) {
      sale.total += parseFloat(saleProduct.price) * parseFloat(saleProduct.quantity);
    }
    sale.totalPrice = sale.total + ( parseFloat(sale.total) * (parseFloat(sale.vat)) / 100 )
    sale.rest = parseFloat(sale.totalPrice) - parseFloat(sale.paid);
    
    sale.count = await prisma.sale.count({
      where: { 
        id: { lte: sale.id },
        company: { ICE: req.headers.company }
      }
    })
    return res.status(200).json(sale);
  }
);

// For the sake of code readability, all POST requests should be placed under this section

// This route creates a quotation. To create a quotation, you need to provide a client ID,
// a list of products, and VAT value
router.post( "/sale/quotation",
  [
    authenticated,
    hasPermission('sale-create'),
    required(['concernId', 'products', 'vat'])
  ],
  async (req, res) => {
    // Field
    const { concernId, products, vat, description } =  req.body;
    const { discount } = req.body;
    // Create Sale
    const createData = {};
    createData.concern = { connect: { id: parseInt(concernId) } }
    createData.vat = parseFloat(vat)
    createData.discount = parseInt(discount ?? 0)
    createData.paid = 0
    createData.shipped = 0
    createData.description = description;
    createData.company = { connect: { ICE: req.headers.company } }
    const sale = await prisma.sale.create({ data: createData, include: { saleProducts: true }})
    // The following lines of code add products to a sale through the 'saleProduct' table.
    for (const product of products) {
      const newSaleProduct = {}; 
      newSaleProduct.saleId = sale.id;
      newSaleProduct.productId = parseInt(product.productId);
      newSaleProduct.price = parseFloat(product.price);
      newSaleProduct.quantity = parseFloat(product.quantity);
      newSaleProduct.type = product.type;
      let p = await prisma.product.findFirst({ where: { id: parseInt(product.productId) } })
      newSaleProduct.productPrice = parseFloat(product.productPrice) ?? p[product.type];
      console.log(newSaleProduct);
      await prisma.saleProduct.create({
        data: newSaleProduct
      });
    }
    return res.json(sale)
  }
);
// This route is an API that converts a quotation into a purchase order by creating a new row in the 'salePurchaseOrder' table.
router.post( '/sale/quotation/:id/purchaseOrder',
  [
    multer({ storage : storage }).any(),
    authenticated,
    hasPermission("sale-create")
  ],
  async (req, res) => {
    const saleId = parseInt(req.params.id);
    // This line retrieves information about a sale.
    const sale = await prisma.sale.findFirst({
      where: { id: saleId },
      include: {
        concern: true,
        saleProducts: true,
        purchaseOrders: true
      }
    });
    // The following line of code checks for duplicated elements in the database.
    if ( sale.purchaseOrders.length > 0 )
      return res.status(422).json('Duplicated records');
    // This line of code creates a purchase order for the quotation (Sale).
    const purchaseOrder = await prisma.salePurchaseOrder.create({ data: { sale: { connect: { id: saleId } } } });
    // If the request includes any documents, they will be added through the following lines of code.
    const files = req.files;
    for (let i = 0; i < files.length; i++) {
      await prisma.SalePurchaseOrderDocument.create({
        data: {
          name: files[i].originalname,
          file: files[i].filename,
          salePurchaseOrderId: purchaseOrder.id
        }
      });
    }
    return res.json({sale: sale, deliveryForm: purchaseOrder, message: 'Purchase Order was wreated successfully'});
  }
);
// This route is an API that converts a quotation into a delivery form by creating a new row in the 'deliveryForm' table.
// router.post( '/sale/quotation/:id/deliveryForm',
//   [
//     authenticated,
//     hasPermission('sale-create'),
//   ],
//   async (req, res) => {
//     const saleId = parseInt(req.params.id);
//     // This line retrieves information about a sale.
//     const sale = await prisma.sale.update({
//       where: { id: saleId },
//       data: { shipped: 1 },
//       include: {
//         concern: true,
//         saleProducts: true
//       }
//     });
//     /**
//      * Sometimes, a user may need to create a delivery form without sufficient stock.
//      * By selecting the 'force create' option, the user can create the delivery form regardless.
//      * The line of code below stores the user's selection in the 'forceCreate' constant variable.
//      */
//     const forceCreate = req.body.forceCreate ? true:false;
//     /**
//      * In the following lines of code, we will loop through the 'saleProducts' and reduce the inventory levels by the specified quantity.
//      * This is achieved by adding rows to the 'inventoryOperation' table. We will also consider and handle any potential errors
//      * that may occur during this process.
//      */
//     for (const saleProduct of sale.saleProducts) {
//       // The following line of code retrieves all inventory records for a specific sale product.
//       const inventories = await prisma.inventory.findMany({
//         include: { inventoryOperations: true },
//         where: { productId: saleProduct.productId },
//         orderBy: { createdAt: 'asc' },
//       });
//       // The following code handles the error of having no inventory records at all
//       if ( inventories.length <= 0 && !forceCreate ) {
//         return res.status(422).json('No inventory')
//       }
//       // The subsequent line of code calculates the remaining quantity for each inventory record,
//       // ensuring that the correct amount is reflected in each inventory
//       let totalRemainingQuantity = 0
//       for (const inventory of inventories) {
//         inventory.remainingQuantity = inventory.quantity;
//         for (const inventoryOperation of inventory.inventoryOperations) {
//           inventory.remainingQuantity -= parseFloat(inventoryOperation.quantity)
//         }
//         totalRemainingQuantity += inventory.remainingQuantity;
//       }
//       // The following code checks if there is enough quantity available and whether the user has selected the 'force create' option.
//       // If either of these conditions is not met, the code removes all the added 'inventoryOperation' records and returns an error
//       // in the response
//       if ( (totalRemainingQuantity < saleProduct.quantity) && !forceCreate ) {
//         await prisma.inventoryOperation.deleteMany({
//           where: { saleProduct: { sale: { id: saleId } } }
//         });
//         return res.status(422).json('Quantité Insuffisant');
//       }
//       /**
//        * In the following lines of code, we use the 'amount' variable to loop through the inventory records and subtract
//        * the remaining quantity of each inventory from the 'amount' until it reaches zero
//        */
//       let amount = saleProduct.quantity;
//       for (const [index, inventory] of inventories.entries()) {
//         if ( amount == 0 ) break;
//         if ( index == (inventories.length - 1) ) {
//           /**
//            * Please be aware that the following operation may result in an inventory with a negative quantity.
//            * To address this issue, we will need to take action when the user creates a new purchase order.
//            * The negative quantity will be compensated for before creating a new inventory. The only potential issue
//            * that may arise is the price of the inventory, but this will be the responsibility of the end user to resolve
//            */
//           await prisma.inventoryOperation.create({
//             data: {
//               quantity: parseFloat(amount),
//               inventoryId: inventory.id,
//               saleProductId: saleProduct.id
//             }
//           });
//         }
//         if ( amount >= inventory.remainingQuantity ) {
//           await prisma.inventoryOperation.create({
//             data: {
//               quantity: parseFloat(inventory.remainingQuantity),
//               inventoryId: inventory.id,
//               saleProductId: saleProduct.id
//             }
//           });
//           amount -= inventory.remainingQuantity;
//         } else {
//           await prisma.inventoryOperation.create({
//             data: {
//               quantity: parseFloat(amount),
//               inventoryId: inventory.id,
//               saleProductId: saleProduct.id
//             }
//           });
//           amount = 0;
//         }
//       }
//     }
//     await prisma.deliveryForm.create({ data: { sale: { connect: { id: parseInt(req.body.saleId)  } } } });
//     return res.json('Delivery Form was Created Successfully');
//   }
// );

router.post(
  `/sale/quotation/:id/deliveryForm`,
  async (req, res) => {
    const forceCreate = true;
    const sale = await prisma.sale.findFirst({
      where: { id: parseInt(req.params.id) },
      // data: { shipped: 1 },
      include: { saleProducts: { include: {
        InventoryOperations: true,
        product: { include: { inventories: { include: { refundOperations: true } } } }
      }}}
    });

    const saleProducts = sale.saleProducts;
    for (const saleProduct of saleProducts) {
      if ( saleProduct.product.inventories.length <= 0 ) {
        if ( !forceCreate ) return res.status(422).json('You have not created any inventory yet');
        await prisma.inventoryOperation.create({
          data: {
            quantity: parseFloat(saleProduct.quantity),
            saleProductId: saleProduct.id
          }
        });
      } else {
        const initialInventory = saleProduct.product.inventories.reduce((acc, inventory) => acc + inventory.quantity, 0);
        const soldInventory = saleProduct.InventoryOperations.reduce((acc, operation) => acc + operation.quantity, 0);
        const refundedInventory = saleProduct.product.inventories.map(
          inventory => inventory.refundOperations.reduce((acc, operation) => acc + operation.quantity, 0)
        ).reduce((acc, quantity) => acc + quantity, 0);
        const quantity = (initialInventory + refundedInventory) - soldInventory;
        var restQuantity = saleProduct.quantity;
        if ( quantity <= saleProduct.quantity && !forceCreate ) return res.status(422).json('No enough inventory');
        for (const inventory of saleProduct.product.inventories) {
          const inventoryOperations = saleProduct.InventoryOperations.filter(operation => operation.inventoryId == inventory.id);
          const soldQuantity = inventoryOperations.reduce((acc, operation) => acc + operation.quantity, 0);
          const refundedQuantity = inventory.refundOperations.reduce((acc, operation) => acc + operation.quantity, 0);
          inventory.restQuantity = (inventory.quantity + refundedQuantity) - soldQuantity;
          if ( inventory.restQuantity >= saleProduct.quantity ) {
            await prisma.inventoryOperation.create({
              data: {
                inventoryId: inventory.id,
                quantity: parseFloat(saleProduct.quantity),
                saleProductId: saleProduct.id
              }
            });
            restQuantity -= saleProduct.quantity;
            break;
          } else if ( inventory.restQuantity < saleProduct.quantity ) {
            await prisma.inventoryOperation.create({
              data: {
                inventoryId: inventory.id,
                quantity: parseFloat(inventory.restQuantity),
                saleProductId: saleProduct.id
              }
            });
            restQuantity -= inventory.restQuantity;
          }
        }
        if ( restQuantity > 0 && forceCreate ) {
          await prisma.inventoryOperation.create({
            data: {
              quantity: parseFloat(restQuantity),
              saleProductId: saleProduct.id
            }
          });
        }
      }
    }
    await prisma.deliveryForm.create({ data: { sale: { connect: { id: parseInt(req.params.id)  } } } });
    return res.json('Delivery Form was Created Successfully');
  }
)

// For the sake of code readability, all PUT requests should be placed under this section

// This API route `converts a quotation into a purchase order by creating a new row in the 'salePurchaseOrder' table.
router.put( '/sale/quotation/:id',
  [
    authenticated,
    hasPermission('sale-update')
  ],
  async (req, res) => {
    const saleId = parseInt(req.params.id);
    // Checki wach quotation hadi + wach dyal company
    const sale = await prisma.sale.findFirst({
      where: { id: saleId },
      include: {
        company: true,
        deliveryForms: true,
        purchaseOrders: true,
        saleProducts: {
          include: { InventoryOperations: true }
        }
      }
    });
    // This code verifies that the quotation being updated belongs to the company of the currently logged-in user
    if ( sale.company.ICE != req.headers.company )
      return res.status(403).json('no access');
    // The following condition checks whether the quotation being updated has not yet been turned into a delivery form or purchase order.
    if ( 
      sale.deliveryForms.length > 0 ||
      sale.purchaseOrders.length > 0 ||
      sale.saleProducts.find(saleProduct => saleProduct.InventoryOperations.length > 0)
    ) {
      console.log('Delivery forms:', sale.deliveryForms.length);
      console.log('Purchase Orders:', sale.purchaseOrders.length);
      console.log('Inventory operations:', sale.saleProducts.find(saleProduct => saleProduct.InventoryOperations.length > 0));
      return res.status(422).json('not a quotation');
    }
    // The code below updates sale information
    const { concernId, vat, description } =  req.body;
    const { discount } = req.body;
    await prisma.sale.update({
      where: { id: saleId },
      data: {
        concernId: parseInt(concernId),
        vat: parseInt(vat),
        discount: parseInt(discount),
        description: description,
      }
    });
    // This code updates or creates sale products based on whether the sale product has an ID. If it does,
    // it updates the product. If not, it creates a new one
    if ( req.body.products ) {
      const saleProducts = req.body.products;
      for (const saleProduct of saleProducts) {
        if ( saleProduct.id ) {
          const saleProductToUpdate = {};
          saleProductToUpdate.price = parseFloat(saleProduct.price);
          saleProductToUpdate.quantity = parseFloat(saleProduct.quantity);
          saleProductToUpdate.productPrice = parseFloat(saleProduct.productPrice);
          saleProductToUpdate.type = saleProduct.type;
          await prisma.saleProduct.update({
            where: { id: parseInt(saleProduct.id) },
            data: saleProductToUpdate
          });
        } else {
          const newSaleProduct = {};
          newSaleProduct.sale = { connect: { id: sale.id } };
          newSaleProduct.product = { connect: { id: parseInt(saleProduct.productId) } };
          newSaleProduct.price = parseFloat(saleProduct.price);
          newSaleProduct.quantity = parseFloat(saleProduct.quantity);
          newSaleProduct.productPrice = parseFloat(saleProduct.productPrice);
          await prisma.saleProduct.create({
            data: newSaleProduct
          });
        }
      }
    }
    // deleted products
    const deletedSaleProducts = req.body.deletedSaleProducts;
    if ( deletedSaleProducts.length > 0 ) {
      for (const saleProduct of deletedSaleProducts) {
        await prisma.saleProduct.delete({
          where: { id: parseInt(saleProduct.id) }
        });
      }
    }
    return res.json('Modified');
  }
);

// For the sake of code readability, all PUT requests should be placed under this section

// This route permanently removes a specific quotation, identified by its ID in the request parameters
router.delete( '/sale/quotation/:id',
  [
    authenticated,
    hasPermission('sale-delete'),
  ],
  async (req, res)  => {
    const saleId = parseInt(req.params.id);
    const sale = await prisma.sale.findFirst({
      where: { id: saleId },
      include: {
        company: true,
        deliveryForms: true,
        purchaseOrders: true,
        saleProducts: {
          include: { InventoryOperations: true }
        }
      }
    });
    // This code verifies that the quotation being updated belongs to the company of the currently logged-in user
    if ( sale.company.ICE != req.headers.company ) return res.status(403).json('no access');
    // The following condition checks whether the quotation being updated has not yet been turned into a delivery form or purchase order.
    if ( 
      sale.deliveryForms.length > 0 ||
      sale.purchaseOrders.length > 0
      // sale.saleProducts.find(saleProduct => saleProduct.InventoryOperations.length > 0)
    ) { 
      console.log('Delivery forms:', sale.deliveryForms.length);
      console.log('Purchase Orders:', sale.purchaseOrders.length);
      console.log('Inventory operations:', sale.saleProducts.find(saleProduct => saleProduct.InventoryOperations.length > 0));
      return res.status(422).json('not a quotation'); 
    }
    // The following lines delete the sale and all associated sale products
    const saleProducts = await prisma.saleProduct.findMany({ where: { sale: { id: sale.id } } })
    for (const saleProduct of saleProducts) {
      await prisma.inventoryOperation.deleteMany({ where: { saleProductId: saleProduct.id } })
    }
    await prisma.saleProduct.deleteMany({ where: { sale: { id: sale.id } } });
    await prisma.sale.delete({ where: { id: sale.id } });
    return res.json('Deleted');
  }
);

module.exports = router;