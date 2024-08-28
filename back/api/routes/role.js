const express = require('express');
const router = express.Router();
const RoleController = require('../controllers/RoleController')
const { PrismaClient } = require('@prisma/client');
const { authenticated, hasPermission } = require('../middlewares');
const prisma = new PrismaClient()

router.get(
    '/roles',
    [ authenticated, hasPermission("role-read") ],
    RoleController.index
)
router.post(
    '/roles',
    [authenticated, hasPermission("role-create")],
  RoleController.create
)
router.put(
    '/roles/:id',
    [authenticated, hasPermission("role-update")],
    RoleController.update
)
router.get(
    '/roles/:id/permissions',
    [authenticated, hasPermission("role-update")],
    RoleController.getRolePermissions
)
router.delete(
    '/roles/:id',
    [authenticated, hasPermission("role-delete")],
    RoleController.remove
)

module.exports = router;
