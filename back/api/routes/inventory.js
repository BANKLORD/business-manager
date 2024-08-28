const express = require('express');
const router = express.Router();
const { authenticated, hasPermission, required } = require('../middlewares');
const InventoryController = require('../controllers/InventoryController');


router.get('/movements', [ authenticated ], InventoryController.getInventoryStatus);
router.get('/movements/:id', [ authenticated ], InventoryController.getInventoryStatus);

module.exports = router