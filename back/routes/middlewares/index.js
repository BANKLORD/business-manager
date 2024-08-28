const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient()
/** Generating Tokens Via JWT */
const jwt = require('jsonwebtoken');
const tokenSecret = process.env.SECRET;

const authenticated = (req, res, next) => {
  const token = req.headers.auth
  // req.companyId = parseInt(req.headers?.company)
  if (!token) return res.status(403).json({error: "Veuillez vous connecter"})
  else {
    jwt.verify(token, tokenSecret, (err, value) => {
      if (err) return res.status(403).json({error: 'Veuillez vous reconnecter'})
      req.user = value?.data
      next()
    })
  }
}

const hasPermission = (permission) => {
  return async ( req, res, next ) => {
    const role = await prisma.userHasRole.findFirst({ where: { userId: parseInt(req.user.id) }}).role();
    const roleHasPermissions = await prisma.roleHasPermission.findMany({ where: { roleId: role.id} });
    const permissionsIds = roleHasPermissions.map(rhp => rhp.permissionId);
    const permissions = await prisma.permission.findMany({ where: { id: { in: permissionsIds } }})
    if ( role && permissions?.find(perm => perm.name == permission || perm.name == 'dev') ) {
      next();
    } else {
      return res.status(419).json("Vous n'avez pas accès")
    }
  }
}

/**
 * 
 * @param { Array<String> } data Example: [ 'username', 'password' ]
 */
const required = (data) => {
  return ( req, res, next ) => {
    for (let i = 0; i < data.length; i++) {
      if ( !req.body[data[i]] )
        return res.status(422).json(`Champs obligatoires manquants: ${data[i]}`)
    }
    next();
  }
}

module.exports = { authenticated, hasPermission, required }