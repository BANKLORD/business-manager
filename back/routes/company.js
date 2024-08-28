const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticated, hasPermission, required } = require('./middlewares');
const prisma = new PrismaClient()

// const XMLHttpRequest = require('xhr2');
// const FileReader = require('FileReader');
// async function toDataUrl(url) {
//   //Convert to base64
//   return new Promise((resolve, reject) => {
//     var xhr = new XMLHttpRequest();
//     xhr.onload = function () {
//       var reader = new FileReader();
//       reader.onloadend = function () {
//         resolve(reader.result);
//       };
//       reader.readAsDataURL(xhr.response);
//     };
//     xhr.onerror = () => {
//       reject({
//         status: this.status,
//         statusText: xhr.statusText,
//       });
//     };
//     xhr.open("GET", url);
//     xhr.responseType = "blob";
//     xhr.send();
//   });
// }

router.get(
  '/company',
  [ authenticated, hasPermission('dev') ],
  async (req, res) => {
  const companies = await prisma.company.findMany()
  return res.json(companies)
})

router.get('/company', async (req, res) => {
  const whereQuery = {};
  if ( req.headers.company )
    whereQuery.ICE = req.headers.company
  else
    return res.status(422).json('No such company')
  const company = await prisma.company.findFirst({ where: whereQuery })
  // company.logoLinkBSF = await toDataUrl(company.logoLink);
  // company.footerLinkBSF = await toDataUrl(company.footerLink);
  return res.json(company)
})

router.post(
  '/company',
  [ authenticated, hasPermission('dev') ],
  async (req, res) => {
  const { name, ICE } = req.body
  const insertQuery = {};
  insertQuery.name = name;
  insertQuery.ICE = ICE;
  const company = await prisma.company.create({ data: insertQuery });
  return res.json(company)
})

module.exports = router;
