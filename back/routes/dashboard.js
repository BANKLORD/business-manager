const express = require('express');
const router = express.Router();
const { PrismaClient, Prisma, ConcernType } = require('@prisma/client');
const { authenticated, hasPermission, required } = require('./middlewares');
const prisma = new PrismaClient()
const dayjs = require('dayjs');
var weekday = require('dayjs/plugin/weekday')
dayjs.extend(weekday)

router.get(
  '/dashboard/profit',
  [ authenticated, hasPermission('sale-read') ],
  async (req, res) => {
    /**
     * Filter range tips:
     * 1 - Last 24 hours
     * 2 - 7 days
     * 3 - 31 Days
    **/
    const { filterType, concern } = req.query;
    const invoiceFilterQuery = {};
    invoiceFilterQuery.deliveryForms = { 
      some: {
        sale: {
          company: {
            ICE: req.headers.company
          }
        }
      }
    }
    if ( concern )
      invoiceFilterQuery.deliveryForms.some.sale.concernId = parseInt(concern);
    /** Getting profit */
    const profit = {
      labels: [],
      data: [],
    };
    if ( filterType ) {
      const tomorrowMidnight = dayjs().add(1, 'day').startOf('day').toDate().getTime();
      // const tomorrowMidnight = dayjs().endOf('day').toDate().getTime();
      switch (parseInt(filterType)) {
        case 1:
          var date = dayjs().startOf('day');
          const endOfDay = dayjs().add(1, 'day').startOf('day').toDate().getTime();
          profit.labels = [];
          while ( endOfDay >= date.toDate().getTime() ) {
            profit.labels.push(date.toDate())
            date = date.add(1, 'hours');
          }
          var invoices = []
          for ( let i=0; i<profit.labels.length-1; i++ ) {
            invoiceFilterQuery.createdAt = { gte: profit.labels[i], lt: profit.labels[i+1] }
            invoices = await prisma.invoice.findMany({ where: invoiceFilterQuery });
            var totalPaid = 0;
            for (const invoice of invoices) {
              totalPaid += parseFloat(invoice.paid)
            }
            profit.data.push(totalPaid)
          }
          break;
        case 2:
          // var date = dayjs().weekday(-7).startOf('day')
          var date = dayjs().startOf('week')
          const endOfWeek = dayjs().endOf('week').endOf('day').toDate().getTime()
          while ( endOfWeek >= date.toDate().getTime() ) {
            if ( endOfWeek == date.toDate().getTime() )
              break;
            date = date.add(1, 'day');
            profit.labels.push(date.toDate())
          }
          var invoices = []
          for ( let i=0; i<profit.labels.length; i++ ) {
            invoiceFilterQuery.createdAt = { gte: profit.labels[i], lt: profit.labels[i+1] }
            invoices = await prisma.invoice.findMany({ where: invoiceFilterQuery });
            var totalPaid = 0;
            for (const invoice of invoices) {
              totalPaid += parseFloat(invoice.paid)
            }
            profit.data.push(totalPaid)
          }
          break;
        case 3:
          var endOfThisMonth = dayjs().endOf('month').toDate().getTime();
          var date = dayjs().startOf('month').startOf('day');
          while ( endOfThisMonth >= date.toDate().getTime() ) {
            date = date.add(1, 'week');
            profit.labels.push(date.toDate())
          }
          var invoices = []
          for ( let i=0; i<profit.labels.length; i++ ) {
            invoiceFilterQuery.createdAt = { gte: profit.labels[i], lt: profit.labels[i+1] }
            invoices = await prisma.invoice.findMany({ where: invoiceFilterQuery });
            var totalPaid = 0;
            for (const invoice of invoices) {
              totalPaid += parseFloat(invoice.paid)
            }
            profit.data.push(totalPaid)
          }
        default:
          break;
      }
    }
    return res.json({ profit: profit, loss: {} })
  }
)

router.get(
  '/dashboard/loss',
  [ authenticated, hasPermission('sale-read') ],
  async (req, res) => {
    /**
     * Filter range tips:
     * 1 - Last 24 hours
     * 2 - 7 days
     * 3 - 31 Days
    **/
    const { filterType } = req.query;
    const purchaseFilterQuery = {};
    purchaseFilterQuery.company = {  ICE: req.headers.company }
    /** Getting loss */
    const loss = {
      labels: [],
      data: [],
    };
    // if ( concern )
    //   purchaseFilterQuery.concernId = parseInt(concern);
    if ( filterType ) {
      const tomorrowMidnight = dayjs().add(1, 'day').startOf('day').toDate().getTime();
      switch ( parseInt(filterType) ) {
        case 1:
          var date = dayjs().startOf('day');
          loss.labels = [];
          while ( tomorrowMidnight != date.toDate().getTime() ) {
            date = date.add(1, 'hour');
            loss.labels.push(date.toDate())
          }
          var purchases = []
          for ( let i=0; i<loss.labels.length-1; i++ ) {
            purchaseFilterQuery.createdAt = { gte: loss.labels[i], lt: loss.labels[i+1] }
            purchases = await prisma.purchase.findMany({ where: purchaseFilterQuery, include: { purchaseProducts: true } });
            var totalPaid = 0;
            for (const purchase of purchases) {
              for (const purchaseProduct of purchase.purchaseProducts) {
                totalPaid += parseFloat(purchaseProduct.price)
              }
            }
            loss.data.push(totalPaid)
          }
          break;
        case 2:
          var date = dayjs().weekday(-7).startOf('day')
          while ( tomorrowMidnight != date.toDate().getTime() ) {
            date = date.add(1, 'day');
            loss.labels.push(date.toDate())
          }
          var purchases = []
          for ( let i=0; i<loss.labels.length; i++ ) {
            purchaseFilterQuery.createdAt = { gte: loss.labels[i], lt: loss.labels[i+1] }
            purchases = await prisma.purchase.findMany({ where: purchaseFilterQuery, include: { purchaseProducts: true } });
            var totalPaid = 0;
            for (const purchase of purchases) {
              for (const purchaseProduct of purchase.purchaseProducts) {
                totalPaid += parseFloat(purchaseProduct.price)
              }
            }
            loss.data.push(totalPaid)
          }
          break;
        case 3:
          var endOfThisMonth = dayjs().endOf('month').toDate().getTime();
          var date = dayjs().startOf('month').startOf('day');
          while ( endOfThisMonth >= date.toDate().getTime() ) {
            date = date.add(1, 'week');
            loss.labels.push(date.toDate())
          }
          var purchases = []
          for ( let i=0; i<loss.labels.length; i++ ) {
            purchaseFilterQuery.createdAt = { gte: loss.labels[i], lt: loss.labels[i+1] }
            purchases = await prisma.purchase.findMany({ where: purchaseFilterQuery, include: { purchaseProducts: true } });
            var totalPaid = 0;
            for (const purchase of purchases) {
              for (const purchaseProduct of purchase.purchaseProducts) {
                totalPaid += parseFloat(purchaseProduct.price)
              }
            }
            loss.data.push(totalPaid)
          }
        default:
          break;
      }
    }
    return res.json({ profit: {}, loss: loss })
  }
)

module.exports = router;