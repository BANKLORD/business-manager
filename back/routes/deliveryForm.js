const express = require('express');
const dayjs = require('dayjs');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticated, hasPermission, required } = require('./middlewares');
const prisma = new PrismaClient()

router.get(
  '/deliveryForms',
  [ authenticated, hasPermission('sale-read') ],
  async (req, res) => {
    const { concern, startDate, endDate } = req.query;
    const whereQuery = { sale: { company: { ICE: req.headers.company } } }
    if ( concern )
      whereQuery.sale = { concernId: parseInt(concern) }
    if ( startDate )
      whereQuery.createdAt = { gte: dayjs(startDate).startOf('day').toDate() }
    if ( startDate ) {
      if ( whereQuery.createdAt )
        whereQuery.createdAt.lte = dayjs(endDate).endOf('day').toDate()
      else
        whereQuery.createdAt = { lte: dayjs(endDate).endOf('day').toDate() }
    }
    const includes = {
      refunds: true,
      sale: {
        include: {
          concern: true,
          saleProducts: {
            include: {
              product: {
                include: { productCodes: true },
              }
            }
          }
        }
      },
      invoice: true,
    };
    const deliveryForms = await prisma.deliveryForm.findMany({
      where: whereQuery,
      include: includes
    })
    for (const deliveryForm of deliveryForms) {
      deliveryForm.sale.total = 0;
      deliveryForm.sale.total -= parseFloat(deliveryForm.sale.discount ?? 0)
      for (const saleProduct of deliveryForm.sale.saleProducts) {
        deliveryForm.sale.total += parseFloat(saleProduct.price) * parseFloat(saleProduct.quantity);
      }
      deliveryForm.sale.totalPrice = deliveryForm.sale.total + ( parseFloat(deliveryForm.sale.total) * (parseFloat(deliveryForm.sale.vat)) / 100 )
      deliveryForm.sale.rest = parseFloat(deliveryForm.sale.totalPrice) - parseFloat(deliveryForm.sale.paid);
    }
    for (const deliverForm of deliveryForms) {
      if ( deliverForm.invoice ) {
        deliverForm.invoice.count = await prisma.invoice.count({
          where: { 
            id: { lte: deliverForm.invoice?.id ?? 0 },
            deliveryForms: { some: { sale: { company: { ICE: req.headers.company } } } }
          }
        })
      }
    }
    return res.json(deliveryForms)
  }
)

router.get(
  '/deliveryForm/:id/invoice',
  [ authenticated, hasPermission('sale-read') ],
  async (req, res) => {
    const deliveryFormId = parseInt(req.params.id)
    if ( !deliveryFormId )
      return res.status(422).json({})
    const deliveryForm = await prisma.deliveryForm.findFirst({ where: { id: deliveryFormId } });
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
                    product: {
                      include: { productCodes: true }
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
)

router.get(
  '/deliveryForm/:id',
  [ authenticated, hasPermission('sale-read') ],
  async (req, res) => {
    const deliveryFormId = parseInt(req.params.id);
    if ( !deliveryFormId )
      return res.status(422).json({})
    const deliveryForm = await prisma.deliveryForm.findFirst({
      where: { id: deliveryFormId },
      include: {
        refunds: true,
        sale: {
          include: {
            concern: true,
            saleProducts: {
              include: {
                product: {
                  include: {
                    productCodes: true
                  }
                }
              }
            }
          }
        },
      }
    });
    deliveryForm.count = await prisma.deliveryForm.count({ where: { id: { lte: deliveryForm.id }, sale: { company: { ICE: req.headers.company } } } });
    return res.json(deliveryForm);
  }
)


router.get(
  '/deliveryForm/:id/refund',
  [ authenticated, hasPermission('sale-read') ],
  async (req, res) => {
    const deliveryFormId = parseInt(req.params.id);
    if ( !deliveryFormId )
      return res.status(422).json({})
    const deliveryForm = await prisma.deliveryForm.findFirst({
      where: { id: deliveryFormId },
      include: {
        refunds: true,
        sale: {
          include: {
            concern: true,
            saleProducts: {
              include: {
                product: {
                  include: {
                    productCodes: true
                  }
                }
              }
            }
          }
        },
      }
    });
    // deliveryForm.count = await prisma.deliveryForm.count({ where: { id: { lte: deliveryForm.id }, sale: { company: { ICE: req.headers.company } } } });
    deliveryForm.count = await prisma.refund.count({
      where: {
        id: { lte: deliveryForm.refunds[0].id },
        deliveryForm: {
          sale: {
            company: { ICE: req.headers.company }
          }
        }
      }
    })
    return res.json(deliveryForm);
  }
)

router.post(
  '/deliveryForm',
  [ authenticated, hasPermission('sale-create') ],
  async (req, res) => {
    const deliveryForm = await prisma.deliveryForm.create({ data: { sale: { connect: { id: parseInt(req.body.saleId)  } } } })
    deliveryForm.count = await prisma.deliveryForm.count({ where: { id: { lte: deliveryForm.id }, sale: { company: { ICE: req.headers.company } } } });
    return res.json(deliveryForm);
  }
)

/** Create invoice to one deliveryForm */
router.post(
  '/deliveryForm/:id/invoice',
  [ authenticated, hasPermission('sale-create') ],
  async (req, res) => {
    const deliveryFormId = parseInt(req.params.id)
    let deliveryForm = await prisma.deliveryForm.findFirst({
      where: { id: deliveryFormId },
      include: { invoice: true, sale: { include: { saleProducts: true } } }
    });
    if ( !deliveryForm.invoiceId ) {
      let totalPrice = 0 - parseFloat(deliveryForm.sale.discount)
      for (const saleProduct of deliveryForm.sale.saleProducts) {
        totalPrice += parseFloat(saleProduct.price) * parseFloat(saleProduct.quantity)
      }
      totalPrice += parseFloat(deliveryForm.sale.vat) * totalPrice / 100
      deliveryForm = await prisma.deliveryForm.update({
        where: { id: deliveryForm.id },
        data: { invoice: { create: { paid: totalPrice } } },
      })
    }
    const invoice = await prisma.invoice.findFirst({
      where: { id: deliveryForm.invoiceId },
      include: { deliveryForms: { include: { sale: { include: { saleProducts: true } } } } }
    })
    invoice.count = await prisma.invoice.count({
      where: { 
        id: { lte: invoice.id },
        deliveryForms: { every: { sale: { company: { ICE: req.headers.company } } } }
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
    return res.json(invoice);
  }
)
/** Create or update invoice with one or more delivery forms */
router.post(
  '/deliveryForm/invoice',
  [ authenticated, hasPermission('sale-create') ],
  async (req, res) => {
    /** Get delivery forms & invoice id ( Create new invoice if there is no invoiceId ) */
    const { deliveries, invoiceId } = req.body;
    let invoice = {};
    // Create or get the invoice
    if ( parseInt(invoiceId) )
      invoice = await prisma.invoice.findFirst({ where: { id: parseInt(invoiceId) }});
    else
      invoice = await prisma.invoice.create({ data: { paid: 0 } });
    /** Now we loop through deliveries and add each on the invoice and summing totalPrice */
    for (const deliveryId of deliveries) {
      // Get the sale and sale's total price so you can mark delivery form as fully paid
      const deliveryForm = await prisma.deliveryForm.findFirst({
        where: { id: deliveryId },
        include: { sale: { include: { saleProducts: true } } }
      });
      const sale = deliveryForm.sale;
      /** By default totalPrice is the discount (E.x totalPrice = -100.00 €) */
      let totalPrice = 0 - (parseFloat(sale.discount) ?? 0);
      for (const saleProduct of sale.saleProducts) {
        /** Looping through the sale products and summing each to the totalPrice */
        totalPrice += parseFloat(saleProduct.price) * parseFloat(saleProduct.quantity);
      }
      // Finally adding the VAT (Value after Tax) to the totalPrice
      // Math Formula: VAT Percent * 100 / totalPrice (a % of the totalPrice)
      totalPrice += parseFloat((parseFloat(sale.vat) * 100) / parseFloat(totalPrice));
      await prisma.deliveryForm.update({
        where: { id: deliveryId },
        data: { invoice: { connect: { id: invoice.id } } }
      });
      /** Summing the totalPrice to the paid column in the invoice */
      invoice.paid += totalPrice;
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { paid: parseFloat(invoice.paid) }
      });

      invoice = await prisma.invoice.findFirst({
        where: { id: invoice.id },
        include: {
          deliveryForms: {
            include: {
              sale: {
                include: {
                  saleProducts: {
                    include: {
                      product: {
                        include: { productCodes: true }
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
    }
    return res.json(invoice);
  }
)

module.exports = router;