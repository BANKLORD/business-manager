const express = require('express');
const router = express.Router();
const { authenticated, hasPermission, required } = require('../../middlewares');
const SaleController = require('../../controllers/sales/SaleController')


router.get(
  `/salesService`,
  [ authenticated, hasPermission('sale-read') ],
    SaleController.index
);

router.get(
  `/saleService/:id`,
  [ authenticated, hasPermission('sale-read') ],
  
    SaleController.index
    
);

router.post( 
  "/saleService",
  [ authenticated, hasPermission('sale-create')],
  SaleController.create
);

router.put(
  `/saleService/:id`,
  [ authenticated, hasPermission('sale-read') ],
    SaleController.update
);

router.delete(
  `/saleService/:id`,
  [ authenticated, hasPermission('sale-read') ],
  SaleController.delete
);

module.exports = router;
