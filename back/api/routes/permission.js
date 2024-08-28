const express = require('express');
const router = express.Router();
const PermissionController = require('../controllers/PermissionController')
const { authenticated, hasPermission } = require('../middlewares');

router.get(
    '/permissions',
    [authenticated, hasPermission("permission-read")],
    PermissionController.index
)
router.post(
    '/permissions',
    [authenticated, hasPermission("permission-create")],
    PermissionController.create
)
router.put(
    '/permissions/:id',
    [authenticated, hasPermission("permission-update")],
    PermissionController.update
)
router.delete(
    '/permissions/:id',
    [authenticated, hasPermission("kfkkfkfk")],
    PermissionController.remove
)

module.exports = router;
