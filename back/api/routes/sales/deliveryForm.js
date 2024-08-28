const express = require('express');
const router = express.Router();
const { authenticated, hasPermission, required } = require('../../middlewares');
const DeliveryFormController = require('../../controllers/Sales/DeliveryFormController');

router.post(
  `/refund`,
  [ authenticated, hasPermission('sale-create') ],
  DeliveryFormController.create
);

router.post(
  `/:id/refund`,
  [ authenticated, hasPermission('sale-create') ],
  DeliveryFormController.createFromInvoice
);

module.exports = router;