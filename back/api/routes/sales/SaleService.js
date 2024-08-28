const express = require('express');
const router = express.Router();
const { authenticated, hasPermission, required } = require('../../middlewares');
const SaleServiceController = require('../../controllers/sales/SaleServiceController')


router.get(
  `/sale/services`,
  [ authenticated, hasPermission('sale-read') ],
    SaleServiceController.index
);

router.get(
  `/sale/service/:id`,
  [ authenticated, hasPermission('sale-read') ],
    SaleServiceController.index
);

router.post( 
  "/sale/service",
  [ authenticated, hasPermission('sale-create'), required(['concernId', 'products', 'vat'])],
  SaleServiceController.create
);

router.post(
  `/sale/service/:id/purchaseOrder`,
  [ authenticated, hasPermission('sale-read') ],
    SaleServiceController.create
);

router.post(
  `/sale/service/:id/deliveryForm`,
  [ authenticated, hasPermission('sale-read') ],
    SaleServiceController.create
);
router.put(
  `/sale/service/:id`,
  [ authenticated, hasPermission('sale-read') ],
    SaleServiceController.update
);

router.delete(
  `/sale/service/:id`,
  [ authenticated, hasPermission('sale-read') ],
  SaleServiceController.delete
);

module.exports = router;
