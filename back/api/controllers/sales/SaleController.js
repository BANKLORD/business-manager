// controllers/ProductController.js

const Sale = require('../../models/sales/Sale');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const SaleServiceController = require('../sales/SaleServiceController');
const dayjs = require('dayjs');




class SaleController {
  static index = async (req, res) => {
    //if ( req.params.id )
      //return res.json(await Sale.findById(req.params.id));

    const companySettings = await prisma.companySettings.findUnique({
      where: { companyId: req.user.companyId,},
    });
    
    const whereQueryBuilder = {};
    if(companySettings?.industryType === 'SERVICE'){
    
      const { startDate, endDate, concernId } = req.query
      whereQueryBuilder.deleted = 0;
      // Date Filter
      if ( concernId > 0 )
        whereQueryBuilder.concernId = parseInt(concernId)
      if ( startDate )
        whereQueryBuilder.createdAt = { gte: dayjs(startDate).startOf('day').toDate() }
      if ( startDate ) {
        if ( whereQueryBuilder.createdAt )
          whereQueryBuilder.createdAt.lte = dayjs(endDate).endOf('day').toDate()
        else
          whereQueryBuilder.createdAt = { lte: dayjs(endDate).endOf('day').toDate() }
      }
      whereQueryBuilder.saleType = companySettings.industryType;
      return res.json(await Sale.getAll(req.user.companyId,whereQueryBuilder));
    }

    const redirectURL = `/sale/quotations?startDate=${req.query.startDate}&endDate=${req.query.endDate}&concernId=${req.query.concernId}&productId=${req.query.productId}&saleType=${companySettings?.industryType}`;

    return res.redirect(redirectURL);
    
  }

  static create = async (req, res) => {
    
    const createSaleQuery = {};
    const optionalFields = [
      { key: 'concernId', convert: parseInt, default: null },
      { key: 'description', convert: (value) => value, default: null },
      { key: 'vat', convert: parseFloat, default: null },
      { key: 'discount', convert: parseInt, default: null },
      { key: 'shipped', convert: parseInt, default: null },
      { key: 'paid', convert: parseFloat, default: null },
      { key: 'saleType', convert: (value) => value, default: null},
    ];

    for (const field of optionalFields) {
      const value = req.body[field.key];
      if (value !== undefined) {
        createSaleQuery[field.key] = field.convert(value) ?? field.default;
      }
    }

    const sale = await Sale.create(createSaleQuery, req.user.companyId);

    req.body.saleId = sale.id;
    
    return SaleServiceController.create(req,res);
  }

  static update = async (req, res) => {

    const sale = await Sale.update(req.params.id, req.body);
    if(req.body.services){
      const saleServices = req.body.services;
      for (const saleService of saleServices) {
        if ( saleService.id ) {
          const saleServiceToUpdate = {};
          saleServiceToUpdate.service = { connect: { id: parseInt(saleService.serviceId) } };
          saleServiceToUpdate.price = parseFloat(saleService.price);
          saleServiceToUpdate.quantity = parseFloat(saleService.quantity);
          saleServiceToUpdate.description = saleService.description;
          saleServiceToUpdate.params = {}
          saleServiceToUpdate.params.id = saleService.id;
          //console.log(saleServiceToUpdate);
          SaleServiceController.update(saleServiceToUpdate,res);
        
        }else{
          //req.body.saleId = sale.id;
          //SaleServiceController.create(req,res);
        }
      }
    }

    
    return res.json(sale);
  }

  static delete = async (req, res) => {
    const { id } = req.params;
    return res.json(await Sale.delete(req.params.id));
  }
}

module.exports = SaleController;