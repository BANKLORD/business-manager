const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticated, hasPermission, required } = require('./middlewares');
const dayjs = require('dayjs');
const prisma = new PrismaClient()

router.get(
  '/sale/:id/deliveryForm',
  [ authenticated, hasPermission('sale-read') ],
  async (req, res) => {
    const saleId = parseInt(req.params.id)
    const whereQuery = { company: { ICE: req.headers.company } }
    whereQuery.id = saleId;
    const sale = await prisma.sale.findFirst({
      where: whereQuery,
      include: { deliveryForms: true }
    })
    if ( sale && sale.deliveryForms.length > 0 ) {
      const deliveryForm = sale.deliveryForms[0]
      deliveryForm.count = await prisma.deliveryForm.count({ where: { id: { lte: deliveryForm?.id }, sale: { company: { ICE: req.headers.company } } } });
      return res.json(deliveryForm)
    }
    return res.status(422).json('Bon de livraison non trouvé')
  }
)

router.get(
  "/sale/:id",
  [ authenticated, hasPermission('sale-read') ],
  async (req, res) => {
    const includes = {
      concern: true,
      saleProducts: { include: { product: { include: { productCodes: true } } } },
      deliveryForms: { include: { invoice: true } },
    }
    let query = {};
    query.deleted = 0;
    query.company = { ICE: req.headers.company }
    query.id = parseInt(req.params.id)
    const sale = await prisma.sale.findFirst({ where: query, include: includes })
    sale.total = 0;
    sale.total -= parseFloat(sale.discount ?? 0)
    for (const saleProduct of sale.saleProducts) {
      sale.total += parseFloat(saleProduct.price) * parseFloat(saleProduct.quantity);
    }
    sale.totalPrice = sale.total + ( parseFloat(sale.total) * (parseFloat(sale.vat)) / 100 )
    sale.rest = parseFloat(sale.totalPrice) - parseFloat(sale.paid);
    /** Get Delivery Form Number */
    for (const deliveryForm of sale.deliveryForms) {
      deliveryForm.count = await prisma.deliveryForm.count({ where: { id: { lte: deliveryForm.id }, sale: { company: { ICE: req.headers.company } } } });
    }
    return res.json(sale)
  }
)

router.get(
  "/sales",
  [ authenticated, hasPermission('sale-read') ],
  async (req, res) => {
    const { startDate, endDate, concernId, productId } = req.query
    const includes = {
      concern: true,
      saleProducts: { include: { product: { include: { productCodes: true } } } },
      deliveryForms: { include: { invoice: true } },
    }
    let query = {};
    query.deleted = 0;
    query.company = { ICE: req.headers.company }
    if ( concernId > 0 )
      query.concernId = parseInt(concernId)
    if ( productId > 0 )
      query.saleProducts = { some: { productId: parseInt(productId) } }
    // Date Filter
    if ( startDate )
      query.createdAt = { gte: dayjs(startDate).startOf('day').toDate() }
    if ( startDate ) {
      if ( query.createdAt )
        query.createdAt.lte = dayjs(endDate).endOf('day').toDate()
      else
       query.createdAt = { lte: dayjs(endDate).endOf('day').toDate() }
    }
    const sales = await prisma.sale.findMany({ where: query, include: includes })
    for (const sale of sales) {
      sale.total = 0;
      sale.total -= parseFloat(sale.discount ?? 0)
      for (const saleProduct of sale.saleProducts) {
        sale.total += parseFloat(saleProduct.price) * parseFloat(saleProduct.quantity);
      }
      sale.totalPrice = sale.total + ( parseFloat(sale.total) * (parseFloat(sale.vat)) / 100 )
      sale.rest = parseFloat(sale.totalPrice) - parseFloat(sale.paid);
    }
    return res.json(sales)
  }
)

router.post(
  "/sale",
  [
    authenticated,
    hasPermission('sale-create'),
    required(['concernId', 'products', 'vat'])
  ],
  async (req, res) => {
    // fields
    const { concernId, products, vat } =  req.body;
    const { discount, paid, shipped, paymentMethod } = req.body;
    // Create Sale
    const createData = {};
    createData.concern = { connect: { id: parseInt(concernId) } }
    createData.vat = parseFloat(vat)
    createData.discount = parseInt(discount ?? 0)
    createData.paid = parseFloat(paid ?? 0)
    createData.shipped = parseInt(shipped ?? 0)
    createData.paymentMethod = paymentMethod;
    createData.company = { connect: { ICE: req.headers.company } }
    const sale = await prisma.sale.create({ data: createData })
    if ( sale.id ) {
      const deliveryForm = await prisma.deliveryForm.create({ data: { sale: { connect: { id: parseInt(sale.id)  } } } })
    }
    // Add products to the sale
    // Perform inventory operation on each Sale Product
    for (const product of products) {
      /**
       * Add all selected products to the current sale using another table called saleProduct
       * requiring type of price (wholesale or retail), quantity, price, product id & sale id
      **/
      const newSaleProduct = {}; 
      newSaleProduct.saleId = sale.id;
      newSaleProduct.productId = parseInt(product.productId);
      newSaleProduct.price = parseFloat(product.price);
      newSaleProduct.quantity = parseFloat(product.quantity);
      newSaleProduct.type = product.type;
      /** Get the product and its quantity */
      let tempProduct = await prisma.product.findFirst({
        where: { id: product.productId },
        include: { inventories: { include: { inventoryOperations: true } }, productCodes: true }
      });
      let tempProductQuantity = 0;
      for (const inventory of tempProduct.inventories) {
        tempProductQuantity += parseFloat(inventory.quantity);
        for (const inventoryOperation of inventory.inventoryOperations) {
          tempProductQuantity -= parseFloat(inventoryOperation.quantity);
        }
      }
      /** Make sure you have more quantity than what the user requested */
      if ( tempProductQuantity < newSaleProduct.quantity ) {
        await prisma.sale.delete({ where: { id: sale.id } });
        return res.status(422).json("Quantité est unsifisant pour: " + tempProduct.productCodes[0].code)
      }
      const saleProduct = await prisma.saleProduct.create({
        data: newSaleProduct
      });
      /** 
       * Get inventories and detect first inventory to perform the inventory operation
       * and then create new inventory operation
      **/
      const inventories = await prisma.inventory.findMany({
        include: { inventoryOperations: true },
        where: { productId: saleProduct.productId },
        orderBy: { createdAt: 'asc' },
      });
      /**
       * you've got two errors here
       * 1 - If the user put more quantity than what he has on the whole inventory
       * 2 - If the user has no inventories at all
       */
      // 2 - let's just check if the user has no inventories at all
      if ( inventories.length < 0 ) {
        await prisma.saleProduct.deleteMany({ where: { saleId: sale.id } })
        await prisma.sale.delete({ where: { id: sale.id } })
        return res.status(422).json('No inventory')
      }
      for (const inventory of inventories) {
        inventory.restQuantity = inventory.quantity;
        for (const inventoryOperation of inventory.inventoryOperations) {
          inventory.restQuantity -= parseFloat(inventoryOperation.quantity)
        }
      }
      // 1 - If the user put more quantity than what he has on the whole inventory
      var totalQuantity = 0
      let restQuantity = saleProduct.quantity;
      for (const inv of inventories) {
        totalQuantity += inv.restQuantity
      }
      if ( totalQuantity < restQuantity ) {
        await prisma.saleProduct.deleteMany({ where: { saleId: sale.id } })
        await prisma.sale.delete({ where: { id: sale.id } })
        return res.status(422).json('Quantity should be ')
      }
      /** Now the we check on both situations we can add the quantity */
      let i = 0
      do {
        if ( restQuantity >= inventories[i].restQuantity ) {
          await prisma.inventoryOperation.create({
            data: {
              quantity: parseFloat(inventories[i].restQuantity),
              inventoryId: inventories[i].id,
              saleProductId: saleProduct.id
            }
          })
          restQuantity -= parseFloat(inventories[i].restQuantity)
        } else {
          await prisma.inventoryOperation.create({
            data: {
              quantity: parseFloat(restQuantity),
              inventoryId: inventories[i].id,
              saleProductId: saleProduct.id
            }
          })
          restQuantity = 0;
        }
        i++;
      } while (restQuantity > 0);
    }
    return res.json('Created')
  }
)

router.put(
  "/sale/:id",
  [
    authenticated,
    hasPermission('sale-update'),
    required(['concernId', 'vat'])
  ],
  async (req, res) => {
    // Fields
    const saleId = parseInt(req.params.id);
    const { concernId, vat } =  req.body;
    const { discount, paid, paymentMethod } = req.body;
    // createOrUpdateData
    const updateData = {};
    updateData.concernId = parseInt(concernId)
    updateData.vat = parseFloat(vat)
    updateData.discount = parseInt(discount ?? 0)
    updateData.paid = parseFloat(paid ?? 0)
    updateData.shipped = 1
    const sale = await prisma.sale.update({
      where: { id: saleId },
      data: updateData
    })
    return res.json('Updated')
  }
)

router.put(
  '/paySales',
  [
    authenticated,
    hasPermission('sale-update'),
  ],
  async (req, res) => {
    // Fields
    console.log(req.body);
    const sales = req.body.data;
    for (const sale of sales) {
      const newSale = await prisma.sale.update({
        where: { id: sale.id },
        data: {
          paid: sale.totalPrice,
          shipped: 1,
        }
      });
    }
    return res.json('Updated')
  }
)

module.exports = router;
