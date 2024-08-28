require('dotenv').config({path: __dirname + '/.env'})
/** Express */
const express = require('express');
/** Using PrismaClient (Prisma ORM) */
const { PrismaClient } = require('@prisma/client');
/** Generating Tokens Via JWT */
const jwt = require('jsonwebtoken');
const tokenSecret = process.env.SECRET;
/** Middlewares will be seperated */
const { authenticated, hasPermission } = require('./middlewares');
/** Cors is to enable REST API requests from other servers rather than localhost:3000 */
const cors = require('cors');
const corsOptions = {
  origin:'*',
  credentials:true,
  optionSuccessStatus:200
}
/** Body parser since some browsers tend to use form data */
const bodyParser = require("body-parser");
var multer = require('multer');
var upload = multer();
const prisma = new PrismaClient()
const app = express()
app.use(express.json())
app.use(cors(corsOptions));
// app.use(bodyParser.json());
// app.use(upload.any());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(bodyParser.text());

app.use(express.static('public'));

app.get('/test', [authenticated, hasPermission("user-create")], (req, res) => {
  return res.status(200).json('Yes you have access to create a new user')
})
app.get('/dashboard', authenticated, (req, res) => {
  console.log(req.user);
  return res.status(200).json(req.user)
})

app.post(
  '/olduser',
  [authenticated, hasPermission("user-create")],
  async (req, res) => {
  const { username, password, companyId, role } = req.body
  if ( !username || !password )
    return res.status(422).json('Bad credentials');
  const user = await prisma.user.create({
    data: {
      username: username,
      password: password,
      companyId: companyId
    },
  })
  if ( role ) {
    prisma.userHasRole.upsert({
      where: {
        userId: user.id
      },
      update: {
        roleId: role.id
      },
      create: {
        userId: user.id,
        roleId: role.id,
        companyId: companyId
      }
    })
  }
  res.json(user);
})
/** USER CRUD (List 'Read') */

// app.put('/user/:id', [authenticated, hasPermission("user-update")], async (req, res) => {
//   const { username, password, role } = req.body
//   if ( !username || !password )
//     return res.status(422).json('Username or password not set');
//   const user = await prisma.user.findFirst({
//     where: {
//       id: parseInt(req.params.id)
//     }
//   })
//   user.username = username;
//   user.password = password;
//   await prisma.user.update({
//     where: { id: user.id },
//     data: { username: user.username, password: user.password }
//   });
//   if ( role ) {
//     const userHasRole = await prisma.userHasRole.findFirst({ where: { userId: user.id } })
//     await prisma.userHasRole.upsert({
//       where: {
//         id: userHasRole?.id ?? 0
//       },
//       update: {
//         roleId: parseInt(role),
//       },
//       create: {
//         user: { connect: { id: user.id } },
//         role: { connect: { id: parseInt(role) } },
//       }
//     })
//   }
//   res.json('updated successfully');
// })

async function generateToken(user) {
  let role = await prisma.userHasRole.findFirst({
    where: {
      userId: user.id
    }
  }).role();
  await prisma.roleHasPermission.findMany({
    where: {
      roleId: role?.id
    }
  }).then(async (res) => {
    role.permissions = [];
    for (let i = 0; i < res.length; i++) {
      let perm = await prisma.permission.findFirst({
        where: {
          id: res[i].permissionId
        }
      })
      role.permissions.push(perm)
    }
  })
  user.role = role
  return jwt.sign({data: user}, tokenSecret, { 'expiresIn': '24h' })
}

/** Testing Route */
app.use(require('./routes/test'))

/** API */
app.use(require('./api/routes/user'))
app.use(require('./api/routes/product'));
app.use(require('./api/routes/company'));
app.use(require('./api/routes/file'));
app.use(require('./api/routes/role'))
app.use(require('./api/routes/permission'))
app.use(require('./api/routes/inventory'));
app.use(require('./api/routes/client'));
app.use(require('./api/routes/service'));
app.use(require('./api/routes/sales/SaleService'));
app.use(require('./api/routes/sales/Sale'));

/** Complaint System */
app.use(require('./api/routes/complaint'));
app.use(require('./api/routes/problem'));


app.use(require('./routes/auth'))
app.use(require('./routes/category'))
app.use(require('./routes/brand'))
app.use(require('./routes/inventory'))
app.use(require('./routes/concern'))
app.use(require('./routes/document'))
app.use(require('./routes/invoice'))
app.use(require('./routes/refund'))
app.use(require('./routes/dashboard'))

// New System (Keep order)
/** Sales */
app.use(require('./routes/sale/deliveryForm'))
app.use(require('./routes/sale/purchaseOrder'))
app.use(require('./routes/sale/quotation'))
app.use(require('./routes/sale/payment'))
app.use(require('./routes/sale/invoice'))
app.use('/sale/invoice/', require('./api/routes/sales/refund'))
// app.use(require('./routes/sale'))
/** Purchases */
app.use(require('./routes/purchase/purchaseOrder'))
app.use(require('./routes/purchase/order'))
app.use(require('./routes/purchase/purchase'))
// app.use(require('./routes/purchase'))
/** Logs */
app.use(require('./routes/user/logs'))
app.listen(process.env.PORT ?? 3000);
console.log(`Server is now running on: ${process.env.PORT ?? 3000}`);
