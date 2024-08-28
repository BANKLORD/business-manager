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

/** This route retrieves all payment methods. */
router.get( '/sale/payment/paymentMethods',
  // [ authenticated, hasPermission('sale-read') ],
  async (req, res) => {
    return res.json(PaymentMethod);
  }
);

/**
 * Uploads a delivery form payment document file to AWS S3 bucket and adds it to the sale payment.
**/
router.put( '/sale/deliveryForm/payment/:id',
  [ authenticated, hasPermission('sale-create'), upload.single('file') ],
  async (req, res) => {
    const { amount, paymentMethod, date, description } = req.body;
    if ( parseFloat(amount) <= 0 )
      return res.status(422).json("Amount cannot be higher than the unpaid total amount");
    const paymentId = parseInt(req.params.id);
    const findPayment = await prisma.salePayment.findFirst({
      where: { id: paymentId },
      include: { documents: true, sale: { include: { deliveryForms: true } } }
    });
    const deliveryForm = await prisma.deliveryForm.findFirst({
      where: { id: findPayment.sale.deliveryForms[0].id },
      include: {
        sale: {
          include: {
            saleProducts: true,
            salePayments: true
          }
        }
      }
    });
    // const deliveryFormId = deliveryForm.id;
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
    if ( parseFloat(amount - findPayment.amount) > unpaidTotal ) {
      return res.status(422).json("Amount cannot be higher than the unpaid total amount");
    }
    const payment = await prisma.salePayment.update({
      where: {
        id: paymentId
      },
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
module.exports = router;