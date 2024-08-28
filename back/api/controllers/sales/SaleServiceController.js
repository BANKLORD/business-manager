// controllers/ProductController.js

const SaleService = require('../../models/sales/SaleService');
const SaleServiceProductController = require('./SaleServiceProductController');

class SaleServiceController {
  static index = async (req, res) => {
    if ( req.params.id )
      return res.json(await SaleService.findById(req.params.id));

    const whereQueryBuilder = {};

    return res.json(await SaleService.getAll(req.user.companyId));

  }

  static create = async (req, res) => {
    
    const saleService = await SaleService.create(req.body, req.user.companyId);

    req.body.saleSerivce = saleService;
    
    return SaleServiceProductController.create(req,res);
  }

  static update = async (req, res) => {

    const saleService = await SaleService.update(req.params.id, req);
    
    return res.json(saleService);
  }

  static delete = async (req, res) => {
    const { id } = req.params;
    return res.json(await SaleService.delete(req.params.id));
  }
}

module.exports = SaleServiceController;