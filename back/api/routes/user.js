const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticated, hasPermission} = require('../middlewares');
const UserController = require('../controllers/UserController')
const prisma = new PrismaClient()

router.get(
    '/users',
    [authenticated, hasPermission('dev') ],
    UserController.index
)
router.post(
    '/users',
    [authenticated, hasPermission('dev')],
    UserController.create
)
router.get(
    '/users/:id/role',
    [authenticated, hasPermission("user-read")],
    UserController.getUserRole
)
router.put(
    '/users/:id',
    [ authenticated, hasPermission('dev') ],
    UserController.update
)



module.exports = router;
