const express = require('express');
const router = express.Router();
const { authenticated, hasPermission, required } = require('../middlewares');
const CompanyController = require('../controllers/CompanyController');

router.get(
  `/company/types`,
  [ authenticated, hasPermission('dev') ],
  CompanyController.types
);


router.get(
  `/company`,
  [ authenticated ],
  CompanyController.getCompany
);

router.get(
  `/companies`,
  [ authenticated, hasPermission('dev') ],
  CompanyController.index
);

router.get(
  `/company/:id`,
  [ authenticated, hasPermission('dev') ],
  CompanyController.index
);
router.get(
    `/company/:id/users`,
    [ authenticated, hasPermission('dev') ],
    CompanyController.getUsers
)
router.get(
    `/company/:id/roles`,
    [ authenticated, hasPermission('dev') ],
    CompanyController.getRoles
)

router.post(
  `/company`,
  [ authenticated, hasPermission('dev') ],
  CompanyController.createOrUpdate
);

router.put(
  `/company/:id`,
  [ authenticated, hasPermission('dev') ],
  CompanyController.createOrUpdate
);

router.put(
  `/company/:id/activate`,
  [ authenticated, hasPermission('dev') ],
  CompanyController.activate
);

router.delete(
  `/company/:id/disable`,
  [ authenticated, hasPermission('dev') ],
  CompanyController.disable
);
module.exports = router
