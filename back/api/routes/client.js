const express = require('express');
const router = express.Router();
const { authenticated, hasPermission, required } = require('../middlewares');
const ClientController = require('../controllers/ClientController');

router.get(
  `/client/analytics`,
  [ authenticated, hasPermission('concern-read') ],
  ClientController.clientsAnalytics
);

router.get(
  `/client/:id/profit`,
  [ authenticated, hasPermission('concern-read') ],
  ClientController.clientProfit
);

module.exports = router