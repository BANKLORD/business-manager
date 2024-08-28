const express = require('express');
const dayjs = require('dayjs');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticated, hasPermission, required } = require('./middlewares');
const prisma = new PrismaClient()

router.get(
  '/purchaseOrders',
  [ authenticated, hasPermission('sale-read') ],
  async (req, res) => {
    const { concern, startDate, endDate } = req.query;
    const whereQuery = {}
    whereQuery.company = { ICE: req.headers.company }
    if ( concern )
      whereQuery.concernId = parseInt(concern)
    if ( startDate )
      whereQuery.createdAt = { gte: dayjs(startDate).startOf('day').toDate() }
    if ( startDate ) {
      if ( whereQuery.createdAt )
        whereQuery.createdAt.lte = dayjs(endDate).endOf('day').toDate()
      else
        whereQuery.createdAt = { lte: dayjs(endDate).endOf('day').toDate() }
    }
    // const includes = { sale: { include: { concern: true, saleProducts: true } } };
    const purchaseOrders = await prisma.sale.findMany({
      where: whereQuery,
      include: { concern: true, saleProducts: true }
    })
    for (const purchaseOrder of purchaseOrders) {
      purchaseOrder.totalPrice = 0 - purchaseOrder.discount;
      for (const saleProduct of purchaseOrder.saleProducts) {
        purchaseOrder.totalPrice += saleProduct.price * saleProduct.quantity;
      }
      const vat = parseFloat(purchaseOrder.vat) * parseFloat(purchaseOrder.totalPrice) / 100
      purchaseOrder.totalPrice += vat 
    }
    return res.json(purchaseOrders)
  }
)

module.exports = router;