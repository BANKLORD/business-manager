const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticated, hasPermission, required } = require('./middlewares');
const prisma = new PrismaClient()

router.get(
  '/users',
  [ authenticated, hasPermission('dev') ],
  async (req, res) => {
    const whereQuery = {};
    if ( req.query.companyId )
      whereQuery.companyId = parseInt(req.query.companyId)
    let users = await prisma.user.findMany({
      where: whereQuery,
      include: {
        company: true,
        userHasRoles: { include: { role: true } }
      }
    })
    for (const user of users) {
      user.role = user.userHasRoles[0]?.role;
    }
    return res.json(users)
})

router.post(
  '/user',
  [ authenticated, hasPermission('dev') ],
  async (req, res) => {
    const { username, password, companyId, role } = req.body
    let user = await prisma.user.create({
      data: {
        username: username,
        password: password,
        companyId: companyId,
        userHasRoles: { create: { roleId: role } }
      },
    })
    return res.json(user)
})

router.put(
  '/user/:id',
  [ authenticated, hasPermission('dev') ],
  async (req, res) => {
    const { username, password, role } = req.body
    const userId = parseInt(req.params.id)
    let user = await prisma.user.update({
      where: {
        id: userId
      },
      data: {
        username: username,
        password: password,
      },
    })
    if ( role > 0 ) {
      const userHasRoleToUpdate = await prisma.userHasRole.findFirst({ where: { userId: userId } });
      await prisma.userHasRole.update({ where: { id: userHasRoleToUpdate.id }, data: { roleId: role } });
    }
    return res.json(user)
})

module.exports = router;