const express = require('express');
const router = express.Router();
const { authenticated, hasPermission, required } = require('../../middlewares');
const RefundController = require('../../controllers/RefundController');

// router.get(
//   `/refund/:id/`,
//   [ authenticated, hasPermission('sale-read') ],
//   RefundController.index
// );

router.get(
  `/:id/refunds`,
  [ authenticated, hasPermission('sale-read') ],
  RefundController.index
);

router.post(
  `/refund`,
  [ authenticated, hasPermission('sale-create') ],
  RefundController.create
);

router.post(
  `/:id/refund`,
  [ authenticated, hasPermission('sale-create') ],
  RefundController.createFromInvoice
);

module.exports = router;