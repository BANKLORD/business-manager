const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticated } = require('../middlewares');
const { connect } = require('http2');
const Product = require('../api/models/Product');
const InventoryController = require('../api/controllers/InventoryController');
const prisma = new PrismaClient()
/**
 * Here You do all the routing ignore all above
 */

/** Install Route (Disable this route later) */
const installRouteDisabled = false;
router.get('/install', async (req, res) => {
  if ( installRouteDisabled )
    return res.status(200).json('Route Disabled');
  /** Creating Permissions */
  let permissions = [
    // Permission CRUD Access
    { name: 'permission-create' },
    { name: 'permission-read' },
    { name: 'permission-update' },
    { name: 'permission-delete' },
    // Role CRUD Access
    { name: 'role-create' },
    { name: 'role-read' },
    { name: 'role-update' },
    { name: 'role-delete' },
    // User CRUD Access
    { name: 'user-create' },
    { name: 'user-read' },
    { name: 'user-update' },
    { name: 'user-delete' },
    // Brand CRUD Access
    { name: 'brand-create' },
    { name: 'brand-read' },
    { name: 'brand-update' },
    { name: 'brand-delete' },
    // Brand CRUD Access
    { name: 'brand-create' },
    { name: 'brand-read' },
    { name: 'brand-update' },
    { name: 'brand-delete' },
    // Category CRUD Access
    { name: 'category-create' },
    { name: 'category-read' },
    { name: 'category-update' },
    { name: 'category-delete' },
    // Product CRUD Access
    { name: 'product-create' },
    { name: 'product-read' },
    { name: 'product-update' },
    { name: 'product-delete' },
    // Stock CRUD Access
    { name: 'inventory-create' },
    { name: 'inventory-read' },
    { name: 'inventory-update' },
    { name: 'inventory-delete' },
    // Concern Access
    { name: 'concern-create' },
    { name: 'concern-read' },
    { name: 'concern-update' },
    { name: 'concern-delete' },
    // Purchase Access
    { name: 'purchase-create' },
    { name: 'purchase-read' },
    { name: 'purchase-update' },
    { name: 'purchase-delete' },
    // Sales Access
    { name: 'sale-create' },
    { name: 'sale-read' },
    { name: 'sale-update' },
    { name: 'sale-delete' },
    // Purchase Documents
    { name: 'document-create' },
    { name: 'document-read' },
    { name: 'document-update' },
    { name: 'document-delete' },
    // Developer Perm
    { name: 'dev' },
  ]
  await prisma.company.createMany({ data: [ { ICE: '002919214000027', name: 'OUSSAMA LLC' } ], skipDuplicates: true });
  const company = await prisma.company.findFirst({ where: { ICE: '002919214000027' } })
  await prisma.permission.createMany({
    data: permissions,
    skipDuplicates: true,
  });
  permissions = await prisma.permission.findMany();
  /** Creating Role */
  const role = { name: 'dev', companyId: company.id }
  await prisma.role.createMany({
    data: [role],
    skipDuplicates: true
  });
  let admin = await prisma.role.findFirst({
    where: {
      name: role.name
    },
  });
  /** Creating First Admin */
  let user = { username: 'dev', companyId: company.id, password: process.env.DEFAULT_ADMIN_PASSWORD }
  await prisma.user.createMany({
    data: [user],
    skipDuplicates: true
  });
  user = await prisma.user.findFirst({
    where: {
      username: user.username,
      companyId: company.id
    }
  })
  /** Syncing Admin role with all possible access */
  let adminHasParms = [];
  for (let i = 0; i < permissions.length; i++) {
    let isExists = await prisma.roleHasPermission.count({ where: {roleId: admin.id, permissionId: permissions[i].id}});
    if ( !isExists )
      adminHasParms.push({ roleId: admin.id, permissionId: permissions[i].id });
  }
  await prisma.roleHasPermission.createMany({
    data: adminHasParms,
    skipDuplicates: true,
  });
  /** Finally Syncing the Admin user with the Admin role */
  let userHasRoleCreated = await prisma.userHasRole.count({
    where: {
      userId: user.id, roleId: admin.id
    }
  })
  if (!userHasRoleCreated )
    await prisma.userHasRole.createMany({
      data: [{ userId: user.id, roleId: admin.id }],
      skipDuplicates: true,
    })
  return res.status(200).json('Installed Successfully')
})

router.get('/hada', async (req, res) => {
  return res.json('Works');
});

router.get('/', async (req, res) => {
  return res.json("Works");
});

router.get('/fix', async (req, res) => {
  const products = await prisma.product.findMany({ where: { companyId: 8 } });
  return res.json(products);
});
module.exports = router;