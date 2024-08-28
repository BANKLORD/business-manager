const express = require('express');
const router = express.Router();
const { PrismaClient, Prisma } = require('@prisma/client');
const { authenticated, hasPermission, required } = require('./middlewares');
const prisma = new PrismaClient()
var path = require('path');

router.get(
  "/documents",
  [ authenticated, hasPermission('document-read') ],
  async (req, res) => {
    // { ICE: req.headers.company }
    const documents = await prisma.purchaseDocument.findMany({
      where: { purchase: { company: { ICE: req.headers.company } } },
      include: {
        purchase: {
          include: {
            concern: true,
            purchaseProducts: true,
          }
        }
      }
    });

    for (const document of documents) {
      document.totalPrice = 0;
      for (const purchaseProduct of document.purchase.purchaseProducts) {
        document.totalPrice += purchaseProduct.price;
      } 
    }
    return res.json(documents)
  }
)

router.get(
  "/document/:id",
  [ authenticated, hasPermission('document-read') ],
  async (req, res) => {
    const documentId = parseInt(req.params.id)
    const document = await prisma.purchaseDocument.findFirst({ where: { id: documentId } });
    // return res.sendFile('../uploads/' + document.file);
    filePath = path.join(__dirname, '../uploads/' + document.file)
    return res.sendFile(filePath)
  }
)

router.delete(
  "/document/:id",
  [ authenticated, hasPermission('document-delete') ],
  async (req, res) => {
    const documentId = parseInt(req.params.id)
    await prisma.purchaseDocument.delete({
      where: { id: documentId }
    })
    return res.json('deleted')
  }
)

module.exports = router;