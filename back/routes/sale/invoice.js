const express = require('express');
const router = express.Router();
const { PrismaClient, PaymentMethod } = require('@prisma/client');
const prisma = new PrismaClient()
const { authenticated, hasPermission, required } = require('../middlewares');
const dayjs = require('dayjs');
/**
 * Multer stores the uploaded files in memory or on disk, and makes it easy to process and access the files in your Node.js application.
 * It can also be configured to handle different types of form data, such as text fields and checkboxes.
**/
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


router.get(
  '/sale/invoices',
  [ authenticated, hasPermission('sale-read') ],
  async (req, res) => {
    const { concern, startDate, endDate } = req.query;
    const whereQuery = { deliveryForms: { some: { sale: { company: { ICE: req.headers.company } } } } }
    if ( concern )
      whereQuery.deliveryForms.some.sale.concernId = parseInt(concern);
    if ( startDate )
      whereQuery.createdAt = { gte: dayjs(startDate).startOf('day').toDate() }
    if ( startDate ) {
      if ( whereQuery.createdAt )
        whereQuery.createdAt.lte = dayjs(endDate).endOf('day').toDate()
      else
        whereQuery.createdAt = { lte: dayjs(endDate).endOf('day').toDate() }
    }
    const includes = {
      deliveryForms: {
        include: {
          sale: {
            include: {
              concern: true,
              saleProducts: {
                include: {
                  product: {
                    include: {
                      productCodes: { orderBy: { id: 'asc' } }
                    }
                  }
                }
              },
            }
          }
        }
      }
    }
    const invoices = await prisma.invoice.findMany({
      where: whereQuery,
      include: includes
    });
    for (const invoice of invoices) {
      invoice.count = await prisma.invoice.count({
        where: { 
          id: { lte: invoice.id ?? 0 },
          deliveryForms: { some: { sale: { company: { ICE: req.headers.company } } } }
        }
      });
      invoice.totalAmountDutyFree = 0;
      invoice.totalAmountInVAT = 0;
      for (const deliveryForm of invoice.deliveryForms) {
        deliveryForm.sale.totalAmountDutyFree = 0;
        deliveryForm.sale.totalAmountInVAT = 0;
        for (const saleProduct of deliveryForm.sale.saleProducts) {
          deliveryForm.sale.totalAmountDutyFree += parseFloat(saleProduct.price * saleProduct.quantity);
        }
        deliveryForm.sale.totalAmountInVAT += parseFloat( parseFloat(deliveryForm.sale.totalAmountDutyFree) * (parseFloat(deliveryForm.sale.vat)) / 100 );
        invoice.totalAmountDutyFree += parseFloat(deliveryForm.sale.totalAmountDutyFree);
        invoice.totalAmountInVAT += parseFloat(deliveryForm.sale.totalAmountInVAT);
      }
    }
    return res.json(invoices)
  }
);

router.get(
  '/sale/invoice/:id',
  [ authenticated, hasPermission('sale-read') ],
  async (req, res) => {
    const invoiceId = parseInt(req.params.id)
    if ( !invoiceId )
      return res.status(422).json({})
    const deliveryForm = await prisma.deliveryForm.findFirst({ where: { invoice: { id: invoiceId } } });
    if ( !deliveryForm.invoiceId )
      return res.status(422).json({})
    const invoice = await prisma.invoice.findFirst({
      where: { id: deliveryForm.invoiceId },
      include: {
        deliveryForms: {
          include: {
            sale: {
              include: {
                concern: true,
                saleProducts: {
                  include: {
                    refundOperations: true,
                    product: {
                      include: { productCodes: { orderBy: { id: 'asc' } } }
                    },
                  }
                }
              }
            }
          }
        }
      }
    })
    invoice.count = await prisma.invoice.count({
      where: { 
        id: { lte: invoice.id },
        deliveryForms: { some: { sale: { company: { ICE: req.headers.company } } } }
      }
    })
    for (const deliveryForm of invoice.deliveryForms) {
      deliveryForm.count = await prisma.deliveryForm.count({
        where: { 
          id: { lte: deliveryForm.id },
          sale: { company: { ICE: req.headers.company } }
        }
      })
    }
    return res.json(invoice)
  }
);

module.exports = router;