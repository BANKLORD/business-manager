
const SaleServiceProduct = require('../../models/sales/SaleServiceProduct');

class SaleServiceProductController {
  static index = async (req, res) => {
    if ( req.params.id )
      return res.json(await SaleServiceProduct.findById(req.params.id));

    const whereQueryBuilder = {};

    return res.json(await SaleServiceProduct.getAll(req.user.companyId, whereQueryBuilder));

  }

  static create = async (req, res) => {
    
    const saleServiceProduct = await SaleServiceProduct.create(req.body, req.user.companyId);
    
    return res.json(saleServiceProduct);
  }

  static update = async (req, res) => {

    const createSaleServiceProductQuery = {};

    const optionalFields = [
      { key: 'quantity', convert: parseFloat, default: null},
      { key: 'description', convert: (value) => value, default: null },
      { key: 'price', convert: parseFloat, default: null },
      { key: 'reference', convert: parseFloat, default: null },
      { key: 'product', convert: (id) => ({ connect: { id: parseInt(id) } }), default: null },
      { key: 'saleService', convert: (id) => ({ connect: { id: parseInt(id) } }), default: null },
    ];

    for (const field of optionalFields) {
      const value = req.body[field.key];
      if (value !== undefined) {
        createSaleServiceProductQuery[field.key] = field.convert(value) ?? field.default;
      }
    }

    const saleServiceProduct = await SaleServiceProduct.update(req.params.id, createSaleServiceProductQuery);
    
    return res.json(saleServiceProduct);
  }

  static delete = async (req, res) => {
    const { id } = req.params;
    return res.json(await SaleServiceProduct.delete(req.params.id));
  }
}

module.exports = SaleServiceProductController;