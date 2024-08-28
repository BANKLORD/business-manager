const lang = require('../lang/fr.json')
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticated, hasPermission, required } = require('./middlewares');
const prisma = new PrismaClient()

router.post(
  "/brand",
  [ authenticated, hasPermission('brand-create'), required(['name']) ],
  async (req, res) => {
    const { name } = req.body;
    const count = await prisma.brand.count({
      where: {
        name: name,
        company: { ICE: req.headers.company }
      }
    });
    if ( count > 0 ) return res.status(422).json(lang.duplicateItemError);
    const brand = await prisma.brand.create({
      data: {
        name: name,
        company: { connect: { ICE: req.headers.company } }
      }
    })
    return res.json(brand)
  }
);

router.put(
  "/brand/:id",
  [authenticated, hasPermission('brand-update')],
  async (req, res) => {
    const { name } = req.body;
    if ( !name ) return res.status(422).json('Missing mandatory fields');
    const nameExitst = await prisma.brand.count({
      where: {
        id: { not: parseInt(req.params.id) },
        name: name,
        company: { ICE: req.headers.company }
      }
    });
    if ( nameExitst ) return res.status(422).json(`le nom de la famille existe déjà dans notre base de données, n'hésitez pas à essayer un autre nom`)
    const brand = await prisma.brand.update({
      where: {
        id: parseInt(req.params.id)
      },
      data: {
        name: name,
      }
    })
    return res.json(brand)
  }
);

router.get(
  "/brands",
  [ authenticated, hasPermission('brand-read') ],
  async (req, res) => {
    const query = {}
    query.deleted = 0
    query.company = { ICE: req.headers.company }
    const brands = await prisma.brand.findMany({ where: query })
    return res.json(brands)
  }
);

router.delete(
  "/brand/:id",
  [authenticated, hasPermission('brand-delete')],
  async (req, res) => {
    const brandId = parseInt(req.params.id)
    /** Mark category as deleted */
    await prisma.brand.update({
      where: { id: brandId },
      data: { deleted: 1 }
    });
    /** Mark category products as deleted */
    // const products = await prisma.category.findFirst({ where: { id: parseInt(req.params.id) } }).products();
    await prisma.product.updateMany({
      where: { brandId: brandId },
      data: { deleted: 1 }
    })
    return res.json('Brand and its products were deleted successfully')
  }
);

module.exports = router;