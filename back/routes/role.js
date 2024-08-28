const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticated, hasPermission } = require('./middlewares');
const prisma = new PrismaClient()

router.get(
  '/roles',
  [ authenticated, hasPermission("role-read") ],
  async (req, res) => {
    const whereQuery = {};
    if ( req.query.companyId )
      whereQuery.companyId = parseInt(req.query.companyId)
    const roles = await prisma.role.findMany({ where: whereQuery, include: { company: true } });
    res.json(roles)
})

router.post('/role', [authenticated, hasPermission("role-create")], async (req, res) => {
  const { name, companyId, permissions } = req.body;
  if ( !req.body.name )
    return res.status(422).json('Missing field: Name')
  await prisma.role.createMany({
    data: [ { name: name, companyId: companyId } ],
    skipDuplicates: true
  })
  const role = await prisma.role.findFirst({ where: { name: name }});
  let roles = [];
  for (let i = 0; i < permissions.length; i++) {
    let isExists = await prisma.roleHasPermission.count({ where: {roleId: role.id, permissionId: permissions[i].id}});
    if ( !isExists )
      roles.push({ roleId: role.id, permissionId: permissions[i].id });
  }
  await prisma.roleHasPermission.createMany({
    data: roles,
    skipDuplicates: true,
  });
  res.json(roles)
})

router.put('/role/:id', [authenticated, hasPermission("role-update")], async (req, res) => {
  const isExists = await prisma.role.count({ where: { id: parseInt(req.params.id) }})
  if ( !isExists ) return res.status(422).json('Role not found')
  const { name, permissions } = req.body;
  if ( !name )
    res.status('422').json('Missing field: Name')
  await prisma.role.update({
    where: {
      id: parseInt(req.params.id)
    },
    data: {
      name: name
    }
  })
  await prisma.roleHasPermission.deleteMany({
    where: {
      roleId: parseInt(req.params.id)
    }
  })
  const roleId = parseInt(req.params.id);
  let roleHasPermissions = [];
  for (let i = 0; i < permissions.length; i++) {
    roleHasPermissions.push({ roleId: roleId, permissionId: permissions[i].id });
  }
  await prisma.roleHasPermission.createMany({
    data: roleHasPermissions,
    skipDuplicates: true,
  });
  res.json(roleHasPermissions)
})

router.get('/role/:id/permissions', [authenticated, hasPermission("role-update")], async (req, res) => {
  if ( !req.params.id ) return res.status(422).json('Please specify a role id')
  const permissions = [] 
  await prisma.roleHasPermission.findMany({
    where: {
      roleId: parseInt(req.params.id)
    }
  }).then(async res => {
    for (let i = 0; i < res.length; i++) {
      let permission = await prisma.permission.findFirst({ where: { id: res[i].permissionId }})
      permissions.push(permission)
    }
  });
  res.json(permissions)
})

router.delete('/role/:id', [authenticated, hasPermission("role-delete")], async (req, res) => {
  await prisma.roleHasPermission.deleteMany({
    where: {
      roleId: parseInt(req.params.id)
    }
  });
  await prisma.role.delete({
    where: {
      id: parseInt(req.params.id)
    }
  })
  res.json('Deleted');
});

router.get('/permissions', [authenticated, hasPermission("permission-read")], async (req, res) => {
  const permissions = await prisma.permission.findMany();
  res.json(permissions)
})

module.exports = router;