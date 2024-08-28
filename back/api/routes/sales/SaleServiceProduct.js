const express = require('express');
const router = express.Router();
const { authenticated, hasPermission, required } = require('../../middlewares');
const SaleSPController = require('../../controllers/sales/SaleSPController')


router.get(
  `/sale/service/products`,
  [ authenticated, hasPermission('sale-read') ],
  SaleSPController.index
);

router.get(
  `/sale/service/product/:id`,
  [ authenticated, hasPermission('sale-read') ],
  SaleSPController.index
);

router.post( 
  "/sale/service/products",
  [ authenticated, hasPermission('sale-create'), required(['concernId', 'products', 'vat'])],
  SaleSPController.create
);

router.post(
  `/sale/service/product/:id/purchaseOrder`,
  [ authenticated, hasPermission('sale-read') ],
  SaleSPController.create
);

router.post(
  `/sale/service/product/:id/deliveryForm`,
  [ authenticated, hasPermission('sale-read') ],
  SaleSPController.create
);
router.put(
  `/sale/service/product/:id`,
  [ authenticated, hasPermission('sale-read') ],
  SaleSPController.update
);

router.delete(
  `/sale/service/product/:id`,
  [ authenticated, hasPermission('sale-read') ],
  SaleSPController.delete
);

module.exports = router;
