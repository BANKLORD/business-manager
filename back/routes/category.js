const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticated, hasPermission } = require('./middlewares');
const prisma = new PrismaClient()

router.post(
  "/category",
  [authenticated, hasPermission('category-create')],
  async (req, res) => {
    const { name } = req.body;
    if ( !name ) return res.status(422).json('Missing mandatory fields');
    const nameExitst = await prisma.category.count({
      where: {
        name: name,
        company: { ICE: req.headers.company }
      },
    })
    if ( nameExitst ) return res.status(422).json('Duplicate data not allowed')
    const category = await prisma.category.create({
      data: {
        name: name,
        company: { connect: { ICE: req.headers.company } }
      }
    })
    return res.json(category)
  }
);

router.put(
  "/category/:id",
  [ authenticated, hasPermission('category-update') ],
  async (req, res) => {
    const { name } = req.body;
    if ( !name ) return res.status(422).json('Missing mandatory fields');
    const nameExitst = await prisma.category.count({
      where: {
        id: { not: parseInt(req.params.id) },
        name: name,
        company: { ICE: req.headers.company }
      }
    });
    if ( nameExitst ) return res.status(422).json(`le nom de la catégorie existe déjà dans notre base de données, n'hésitez pas à essayer un autre nom`)
    const category = await prisma.category.update({
      where: {
        id: parseInt(req.params.id),
      },
      data: {
        name: name,
      }
    })
    return res.json(category)
  }
);

router.get(
  "/categories",
  [authenticated, hasPermission('category-read')],
  async (req, res) => {
    const searchQuery = {};
    searchQuery.deleted = 0;
    searchQuery.company = { ICE: req.headers.company }
    if ( req.query.searchTerm )
      searchQuery.name = { contains: req.query.searchTerm }
    const categories = await prisma.category.findMany({ where: searchQuery })
    return res.json(categories)
  }
);

router.delete(
  "/category/:id",
  [authenticated, hasPermission('category-delete')],
  async (req, res) => {
    const categoryId = parseInt(req.params.id)
    const category = await prisma.category.findFirst({
      where: { id: categoryId },
      include: { products: true }
    });
    /** Category has no products delete it then */
    if ( category.products.length == 0 ) {
      await prisma.category.delete({
        where: { id: categoryId }
      })
      return res.json('deleted')
    }
    /** Mark category as deleted */
    await prisma.category.update({
      where: { id: categoryId },
      data: { deleted: 1 }
    });
    /** Mark category products as deleted */
    // const products = await prisma.category.findFirst({ where: { id: parseInt(req.params.id) } }).products();
    await prisma.product.updateMany({
      where: { categoryId: categoryId },
      data: { deleted: 1 }
    })
    return res.json('Category and its products were deleted successfully')
  }
);

module.exports = router;