const express = require('express');
const router = express.Router();
const { authenticated, hasPermission, required } = require('../middlewares');
const ComplaintController = require('../controllers/ComplaintController');

router.get(
  `/complaints`,
  [ authenticated, hasPermission('complaint-read') ],
  ComplaintController.index
);

router.get(
  `/complaint/:id`,
  [ authenticated, hasPermission('complaint-read') ],
  ComplaintController.index
);

router.get(
  `/complaints/user/:id`,
  [ authenticated, hasPermission('complaint-read') ],
  ComplaintController.getUserComplaints
);

router.post(
  `/complaint`,
  [ authenticated, hasPermission('complaint-create') ],
  ComplaintController.create
);

router.put(
  `/complaint/:id`,
  [ authenticated, hasPermission('complaint-create') ],
  ComplaintController.update
);

router.delete(
  `/complaint/:id`,
  [ authenticated, hasPermission('complaint-create') ],
  ComplaintController.delete
);

module.exports = router