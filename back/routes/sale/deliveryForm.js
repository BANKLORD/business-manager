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
const AWS = require('aws-sdk');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, uuidv4() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// For the sake of code readability, all GET requests should be placed under this section

/**
 * This route retrieves all delivery forms, including the associated sales and inventory operations.
**/
router.get( '/sale/deliveryForms',
  [ authenticated, hasPermission('sale-read') ],
  async (req, res) => {
    // The following lines are used to check for filters and retrieve filtering data from the request.
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
    // The following lines handle the inclusion of data such as the sale, sale products, and concern information..
    const includes = {
      refunds: true,
      sale: {
        include: {
          concern: true,
          salePayments: true,
          saleProducts: {
            include: {
              refundOperations: true,
              product: {
                include: { productCodes: { orderBy: { id: 'asc' } } },
              },
            }
          },
        }
      },
      invoice: { include: { refunds: true } },
    };
    // The following code uses Prisma to retrieve a list of delivery forms.
    const deliveryForms = await prisma.deliveryForm.findMany({
      where: whereQuery,
      include: {
        refunds: true,
        sale: {
          include: {
            concern: true,
            salePayments: true,
            saleProducts: {
              include: {
                refundOperations: true,
                product: {
                  include: { productCodes: { orderBy: { id: 'asc' } } },
                },
              }
            },
          }
        },
        invoice: { include: { refunds: true } },
      },
      orderBy: { createdAt: "desc" }
    })
    // The following code retrieves the total amount duty free and totale amount of vat and also total amount including vat
    // for each delivery form.
    for (const deliveryForm of deliveryForms) {
      deliveryForm.totalAmountInRefund = deliveryForm.sale.saleProducts.reduce(
        (acc, saleProduct) => acc + (saleProduct.price * saleProduct.refundOperations.reduce(
          (acc2, refundOperation) => acc2 + refundOperation.quantity, 0)
        ), 0)
      deliveryForm.sale.totalAmountDutyFree = 0 - deliveryForm.totalAmountInRefund;
      deliveryForm.sale.totalAmountInVAT = 0;
      for (const saleProduct of deliveryForm.sale.saleProducts) {
        deliveryForm.sale.totalAmountDutyFree += parseFloat(saleProduct.price * saleProduct.quantity);
      }
      deliveryForm.sale.totalAmountInVAT += parseFloat( parseFloat(deliveryForm.sale.totalAmountDutyFree) * (parseFloat(deliveryForm.sale.vat)) / 100 );

      //  Payments
      deliveryForm.sale.totalPaidAmount = 0;
      deliveryForm.sale.totalUnPaidAmount = 0 - deliveryForm.totalAmountInRefund;
      for (const payment of deliveryForm.sale.salePayments) {
        deliveryForm.sale.totalPaidAmount += parseFloat(payment.amount);
      }
      deliveryForm.sale.totalUnPaidAmount = parseFloat(deliveryForm.sale.totalAmountInVAT + deliveryForm.sale.totalAmountDutyFree - deliveryForm.sale.totalPaidAmount);

      // The following lines are used to retrieve the invoice number for each delivery form, if an invoice exists.
      if ( deliveryForm.invoice ) {
        deliveryForm.invoice.count = await prisma.invoice.count({
          where: { 
            id: { lte: deliveryForm.invoice?.id ?? 0 },
            deliveryForms: { some: { sale: { company: { ICE: req.headers.company } } } }
          }
        })
      }
    }
    return res.json(deliveryForms)
  }
);

// This route retrieves a specific delivery form
router.get( '/sale/deliveryForm/:id',
  [ authenticated, hasPermission('sale-read') ],
  async (req, res) => {
    const deliveryFormId = parseInt(req.params.id);
    if ( !deliveryFormId )
      return res.status(422).json({})
    const df = await prisma.deliveryForm.findFirst({ where: { id: deliveryFormId } });
    const sale = await prisma.sale.findFirst({
      where: { id: df.saleId },
      include: {
        deliveryForms: { include: { refunds: true } },
        concern: true,
        saleProducts: {
          include: {
            product: { include: { productCodes: { orderBy: { id: 'asc' } } } }
          }
        }
      },
    });
    sale.count = await prisma.deliveryForm.count({ where: { id: { lte: sale.deliveryForms[0].id }, sale: { company: { ICE: req.headers.company } } } });
    return res.json(sale);
  }
);
// This route retrieves a specific delivery form's refund
router.get( '/sale/deliveryForm/:id/refund',
  [ authenticated, hasPermission('sale-read') ],
  async (req, res) => {
    const deliveryFormId = parseInt(req.params.id);
    if ( !deliveryFormId )
      return res.status(422).json({})
    const df = await prisma.deliveryForm.findFirst({ where: { id: deliveryFormId }, include: { refunds: true } });
    const sale = await prisma.sale.findFirst({
      where: { id: df.saleId },
      include: {
        deliveryForms: { include: { refunds: true } },
        concern: true,
        saleProducts: {
          include: {
            product: { include: { productCodes: { orderBy: { id: 'asc' } } } }
          }
        }
      },
    });
    // sale.count = await prisma.deliveryForm.count({ where: { id: { lte: sale.deliveryForms[0].id }, sale: { company: { ICE: req.headers.company } } } });
    sale.count = await prisma.refund.count({
      where: {
        id: { lte: df.refunds[0].id },
        deliveryForm: {
          sale: {
            company: { ICE: req.headers.company }
          }
        }
      }
    })
    return res.json(sale);
  }
);
// This route retrieves a specific invoice by delivery form ID
router.get( '/sale/deliveryForm/:id/invoice',
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
//
router.get( '/sale/deliveryForm/:id/payments',
  [ authenticated, hasPermission('sale-read') ],
  async (req, res) => {
    const deliveryFormId = parseInt(req.params.id);
    const sale = await prisma.sale.findFirst({
      where: { deliveryForms: { some: { id: deliveryFormId } } }
    });
    const payments = await prisma.salePayment.findMany({
      where: { sale: { id: sale.id } },
      include: { documents: true },
      orderBy: { date: 'desc' }
    });
    return res.json(payments);
  }
);

// For the sake of code readability, all POST requests should be placed under this section

/**
 * This route creates a Delivery Form. To create a Delivery Form, you need to provide a client ID, a list of products, and VAT value
**/
router.post( "/sale/deliveryForm",
  [
    authenticated,
    hasPermission('sale-create'),
    required(['concernId', 'products', 'vat'])
  ],
  async (req, res) => {
    // Fields
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
    var sale = await prisma.sale.create({ data: createData, include: { saleProducts: true }})
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
      // console.log(newSaleProduct);
      await prisma.saleProduct.create({
        data: newSaleProduct
      });
    }
    const forceCreate = true;
    sale = await prisma.sale.findFirst({
      where: { id: parseInt(sale.id) },
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
    await prisma.deliveryForm.create({ data: { sale: { connect: { id: parseInt(sale.id)  } } } });
    return res.json('Delivery Form was Created Successfully');
  }
);
/** Create invoice to one deliveryForm */
router.post( '/sale/deliveryForm/:id/invoice',
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
);
/**
 * Uploads a delivery form payment document file to AWS S3 bucket and adds it to the sale payment.
**/
router.post( '/sale/deliveryForm/:id/payment',
  [ authenticated, hasPermission('sale-create'), upload.single('file') ],
  async (req, res) => {
    const { amount, paymentMethod, date, description } = req.body;
    if ( parseFloat(amount) <= 0 )
      return res.status(422).json("Amount cannot be higher than the unpaid total amount");
    const deliveryFormId = parseInt(req.params.id);
    const deliveryForm = await prisma.deliveryForm.findFirst({
      where: { id: deliveryFormId },
      include: {
        sale: {
          include: {
            saleProducts: true,
            salePayments: true
          }
        }
      }
    });
    /** Checking if the payment is more than enough */
    // retrieving total amount in document
    deliveryForm.sale.totalAmountDutyFree = 0;
    deliveryForm.sale.totalAmountInVAT = 0;
    for (const saleProduct of deliveryForm.sale.saleProducts) {
      deliveryForm.sale.totalAmountDutyFree += parseFloat(saleProduct.price * saleProduct.quantity);
    }
    deliveryForm.sale.totalAmountInVAT += parseFloat( parseFloat(deliveryForm.sale.totalAmountDutyFree) * (parseFloat(deliveryForm.sale.vat)) / 100 );
    //
    deliveryForm.sale.totalAmountPaid = 0;
    for (const payment of deliveryForm.sale.salePayments) {
      deliveryForm.sale.totalAmountPaid += parseFloat(payment.amount);
    }
    const unpaidTotal = deliveryForm.sale.totalAmountDutyFree + deliveryForm.sale.totalAmountInVAT - deliveryForm.sale.totalAmountPaid;
    if ( parseFloat(amount) > unpaidTotal ) {
      return res.status(422).json("Amount cannot be higher than the unpaid total amount");
    }
    const payment = await prisma.salePayment.create({
      data: {
        sale: { connect: { id: deliveryForm.saleId } },
        amount: parseFloat(amount),
        paymentMethod: PaymentMethod[paymentMethod],
        date: dayjs(date).toDate(),
        description: description,
        userId: req.user.id
      }
    });

    // var fileUrl = null;
    if (req.file) {
      const fileContent = fs.readFileSync(req.file.path);
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `sale/payment/${uuidv4()}-${req.file.originalname}`,
        Body: fileContent,
        ACL: 'public-read'
      };
      const uploadResult = await s3.upload(params).promise();
      const fileUrl = uploadResult.Location;
      await prisma.salePaymentDocument.create({
        data: {
          documentUrl: fileUrl,
          salePayment: { connect: { id: payment.id } },
        }
      });
      fs.unlinkSync(req.file.path);
    }
    return res.json(payment);
  }
);

/** Create or update invoice with one or more delivery forms */
router.post( '/sale/deliveryForm/invoice',
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
    for (const deliveryFormId of deliveries) {
      // Get the sale and sale's total price so you can mark delivery form as fully paid
      const deliveryForm = await prisma.deliveryForm.findFirst({
        where: { id: deliveryFormId },
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
        where: { id: deliveryFormId },
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
    }
    return res.json(invoice);
  }
);

// For the sake of code readability, all PUT requests should be placed under this section

// For the sake of code readability, all DELETE requests should be placed under this section

module.exports = router;