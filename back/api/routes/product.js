const express = require('express');
const router = express.Router();
const { authenticated, hasPermission, required } = require('../middlewares');
const ProductController = require('../controllers/ProductController');

router.get(
  `/products`,
  [ authenticated, hasPermission('product-read') ],
  ProductController.index
);

router.get(
  `/product/:id`,
  [ authenticated, hasPermission('product-read') ],
  ProductController.index
);

router.get(
  `/product/:id/movements`,
  [ authenticated, hasPermission('product-read') ],
  ProductController.getMovements
);

router.post(
  `/product`,
  [ authenticated, hasPermission('product-create'), required(['codes', 'buy_price', 'wholesale_price']) ],
  ProductController.create
);

router.put(
  `/product/:id`,
  [ authenticated, hasPermission('product-update'), required(['codes', 'categoryId']) ],
  ProductController.update
);

router.delete(
  `/product/:id`,
  [ authenticated, hasPermission('product-update') ],
  ProductController.delete
);

module.exports = router;