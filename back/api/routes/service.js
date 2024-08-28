const express = require('express');
const router = express.Router();
const { authenticated, hasPermission, required } = require('../middlewares');
const ServiceController = require('../controllers/ServiceController')

router.get(
  `/services`,
  [ authenticated, hasPermission('product-read') ],
  ServiceController.index
);

router.get(
  `/service/:id`,
  [ authenticated, hasPermission('product-read') ],
  ServiceController.index
);

router.post(
  `/service`,
  [ authenticated, hasPermission('product-create') ],
  ServiceController.create
);

router.put(
  `/service/:id`,
  [ authenticated, hasPermission('product-update') ],
  ServiceController.update
);

router.delete(
  `/service/:id`,
  [ authenticated, hasPermission('product-update') ],
  ServiceController.delete
);

module.exports = router;