const express = require('express');
const router = express.Router();
const { authenticated, hasPermission, required } = require('../middlewares');
const ProblemController = require('../controllers/ProblemController');

router.get(
  `/problems`,
  [ authenticated, hasPermission('problem-read') ],
  ProblemController.index
);

router.get(
  `/problem/:id`,
  [ authenticated, hasPermission('problem-read') ],
  ProblemController.index
);

router.get(
  `/problems/complaint/:id`,
  [ authenticated, hasPermission('problem-read') ],
  ProblemController.getComplaintProblems
);

router.post(
  `/problem`,
  [ authenticated, hasPermission('problem-create') ],
  ProblemController.create
);

router.put(
  `/problem/:id`,
  [ authenticated, hasPermission('problem-create') ],
  ProblemController.update
);

router.delete(
  `/problem/:id`,
  [ authenticated, hasPermission('problem-create') ],
  ProblemController.delete
);

module.exports = router