const express = require('express');
const router = express.Router();
const { PrismaClient, Prisma, ConcernType } = require('@prisma/client');
const { authenticated, hasPermission, required } = require('./middlewares');
const prisma = new PrismaClient()

async function createOrUpdateProvider(req, res) {
  const id = parseInt(req.params.id);
  const data = req.body; 
  /** Check our request variables */
  if ( !data.companyName || !data.address || !data.ice || !data.rc )
    return res.status(422).json('Missing mandatory fields');
  let createQuery = {};
  for (const key in data) {
    if (key != 'type' && key != 'id' ) {
      createQuery[key] = data[key]
    }
  }
  createQuery.type = ConcernType.Provider
  await prisma.concern.upsert({ where: { id: id? id:0 } , update: createQuery, create: createQuery });
  // await prisma.concern.create({ data: createQuery });
  return res.json('Created')
}

async function createOrUpdateClient(req, res) {
  const id = parseInt(req.params.id);
  const data = req.body; 
  /** Check our request variables */
  if ( !data.name && !data.surname && !data.companyName )
    return res.status(422).json('Missing mandatory fields');
  let createQuery = {};
  for (const key in data) {
    if (key != 'type' && key != 'id' ) {
      createQuery[key] = data[key]
    }
  }
  createQuery.type = ConcernType.Client
  await prisma.concern.upsert({ where: { id: id? id:0 } , update: createQuery, create: createQuery });
  return res.json('Created')
}

async function createOrUpdateProviderClient(req, res) {
  const id = parseInt(req.params.id);
  const data = req.body; 
  /** Check our request variables */
  if ( !data.companyName || !data.address || !data.ice || !data.rc )
    return res.status(422).json('Missing mandatory fields');
  let createQuery = {};
  for (const key in data) {
    if (key != 'type' && key != 'id' ) {
      createQuery[key] = data[key]
    }
  }
  createQuery.type = ConcernType.Both
  await prisma.concern.upsert({ where: { id: id? id:0 } , update: createQuery, create: createQuery });
  // await prisma.concern.create({ data: createQuery });
  return res.json('Created')
}

router.get(
  "/concerns",
  [authenticated, hasPermission('concern-read')],
  async (req, res) => {
    const { searchTerm, type } = req.query
    let searchQuery = {};
    if ( searchTerm ) {
      searchQuery.OR = [
        { name: searchTerm },
        { surname: searchTerm },
        { email: searchTerm },
        { companyName: searchTerm },
      ]
    }
    searchQuery.AND = [ 
      { OR: [
        { type: type, deleted: 0 },
        { type: 'Both', deleted: 0 },
      ], company: { ICE: req.headers.company }  }
    ]
    // searchQuery.AND =
    const concerns = await prisma.concern.findMany({ where: searchQuery });
    return res.json(concerns)
  }
)

router.post(
  "/concern",
  [ authenticated, hasPermission('concern-create'), required(['type']) ],
  async (req, res) => {
    /** Type of concern is a mandatory field */
    const type = req.body.type;
    req.body.company = { connect: { ICE: req.headers.company } }
    switch (type) {
      case 'Client':
        return await createOrUpdateClient(req, res)
      case 'Provider':
        return await createOrUpdateProvider(req, res)
      case 'Both':
        return await createOrUpdateProviderClient(req, res)
      default:
        return res.status(422).json('Insert normal type')
    }
  }
)

router.put(
  "/concern/:id",
  [ authenticated, hasPermission('concern-update'), required(['type']) ],
  async (req, res) => {
    /** Type of concern is a mandatory field */
    const type = req.body.type;
    switch (type) {
      case 'Client':
        return await createOrUpdateClient(req, res)
      case 'Provider':
        return await createOrUpdateProvider(req, res)
      case 'Both':
        return await createOrUpdateProviderClient(req, res)
      default:
        return res.status(422).json('Insert normal type')
    }
  }
)

router.delete(
  '/concern/:id',
  [ authenticated, hasPermission('concern-delete') ],
  async (req, res) => {
    const id = parseInt(req.params.id)
    await prisma.concern.update({ where: { id: id }, data: { deleted: 1 }})
    return res.json('Deleted')
  }
)

module.exports = router;