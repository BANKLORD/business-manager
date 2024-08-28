const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticated, hasPermission, required } = require('./middlewares');
const prisma = new PrismaClient()

router.post(
  '/refund',
  [ authenticated ],
  async (req, res) => {
    const {deliveryFormId, deliveryForms} = req.body
    // Check wether request contains one or many delivery forms
    if( deliveryFormId ) {
      // Check wether the delivery form belongs to the user or not, otherwise return a 403 forbidden.
      const isDFBelongsToUser = await prisma.deliveryForm.count({
        where: {
          id: parseInt(deliveryFormId),
          sale: {
            company: {
              ICE: req.headers.company
            }
          }
        }
      })
      if ( !isDFBelongsToUser ) return res.status(422).json('Not your delivery form')
      const isDFAlreadyExists = await prisma.refund.count({ where: { deliveryFormId: parseInt(deliveryFormId) } })
      if ( isDFAlreadyExists ) return res.status(422).json('Delivery Form already refunded!')
      // Get the delivery form
      // We're gonna need it to fill in the refund operations later (invetoryId & refunded quantity)
      const deliveryForm = await prisma.deliveryForm.findFirst({
        where: { id: parseInt(deliveryFormId) },
        include: { sale: { include: { saleProducts: { include: { InventoryOperations: true } } } } }
      })
      var refundedOperations = [];
      for (const saleProduct of deliveryForm.sale.saleProducts) {
        for (const inventoryOperation of saleProduct.InventoryOperations) {
          refundedOperations.push({
            inventoryId: inventoryOperation.inventoryId,
            quantity: inventoryOperation.quantity
          })
        }
      }
      // Issue refund with its refunded items
      const refund = await prisma.refund.create({
        data: {
          deliveryFormId: parseInt(deliveryFormId),
          refundOperations: {
            createMany: {
              data: refundedOperations,
              skipDuplicates: true,
            }
          }
        },
        /** Needed includes here */
      });
      return res.status(200).json(refund);
    } else if (deliveryForms.length > 0) {
      for (var id of deliveryForms) { id = parseInt(id); }
      const deliveryFormsFullInfo = await prisma.deliveryForm.findMany({
        where: { id: { in: deliveryForms } },
        include: { sale: { include: { saleProducts: { include: { InventoryOperations: true } } } } }
      })
      // Check wether the delivery form belongs to the user or not, otherwise return a 403 forbidden.
      const isDFBelongsToUser = await prisma.deliveryForm.count({
        where: {
          id: { in: deliveryForms },
          sale: {
            company: {
              ICE: req.headers.company
            }
          }
        }
      })
      if ( !(isDFBelongsToUser >= deliveryForms.length) ) return res.json(403, "Pas d'access");
      // Get all delivery forms with all parsed to int
      // We're gonna need it to fill in the refund operations later (invetoryId & refunded quantity)
      for (const deliveryForm of deliveryForms) {
        deliveryForm.refundedOperations = [];
        for (const saleProduct of deliveryForm.sale.saleProducts) {
          for (const inventoryOperation of saleProduct.InventoryOperations) {
            deliveryForm.refundedOperations.push({
              inventoryId: inventoryOperation.inventoryId,
              quantity: inventoryOperation.quantity
            })
          }
        }
      }
      // Issue refund with its refunded items
      const refunds = [];
      for (const deliveryForm of deliveryForms) {
        let refund = await prisma.refund.create({
          data: {
            deliveryFormId: parseInt(deliveryForm.id),
            refundOperations: {
              createMany: {
                data: deliveryForm.refundedOperations,
                skipDuplicates: true,
              }
            }
          },
          /** Needed includes here */
        })
        refunds.push(refund)
      }
      return res.json(200, refunds);
    }
    else return res.json(422, 'Specify one or more deliveries')
  }
)

router.delete(
  '/refund/:id',
  [ authenticated ],
  async (req, res) => {
    const refundId = parseInt(req.params.id)
    const refund = await prisma.refund.delete({
      where: { id: refundId },
      include: { refundOperations: true }
    })
    return res.json(200, 'record was deleted')
  }
)

module.exports = router;