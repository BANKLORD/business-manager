// controllers/ProductController.js

const Product = require('../models/Product');

class ProductController {
  static index = async (req, res) => {
    if ( req.params.id )
      return res.json(await Product.findById(req.params.id));
    // Get All Products
    const { searchTerm, brandId, categoryId, code } = req.query;
    const whereQueryBuilder = {};
    if ( searchTerm )
      whereQueryBuilder.productCodes = { some: { code: { contains: searchTerm } } }
    if ( brandId > 0 )
      whereQueryBuilder.brandId = parseInt(brandId)
    if ( categoryId > 0 )
      whereQueryBuilder.categoryId = parseInt(categoryId)
    if ( code )
      whereQueryBuilder.productCodes = { every: { code: code } }
    return res.json(await Product.getAll(req.user.companyId, whereQueryBuilder));
  }

  static getMovements = async (req, res) => {
    return res.json(await Product.getMovements(req.params.id));
  }

  static create = async (req, res) => {
    const { codes } = req.body;
    // Check if any of the codes in the `codes` array already exist in the database
    // for the company specified in the request headers. If duplicates are found,
    // return an error response.
    if ( await Product.exists(codes, req.user.companyId) )
      return res.status(422).json("Le code que vous essayez d'insérer existe déjà dans les enregistrements");
    // Set mandatory fields
    const createProductQuery = {};
    req.body.category = req.body.categoryId 
    req.body.brand = req.body.brandId 
    // Set optional fields, if provided
    const optionalFields = [
      { key: 'buy_price', convert: parseFloat },
      { key: 'wholesale_price', convert: parseFloat, default: 0.00 },
      { key: 'retail_price', convert: parseFloat, default: 0.00 },
      { key: 'category', convert: (id) => ({ connect: { id: parseInt(id) } }), default: null },
      { key: 'brand', convert: (id) => ({ connect: { id: parseInt(id) } }), default: null },
      { key: 'description', convert: (value) => value, default: null },
      { key: 'unity', convert: (value) => value, default: null },
      { key: 'stockAlert', convert: parseFloat, default: null },
    ];

    for (const field of optionalFields) {
      const value = req.body[field.key];
      if (value !== undefined) {
        createProductQuery[field.key] = field.convert(value) ?? field.default;
      }
    }

    const product = await Product.create(createProductQuery, codes, req.user.companyId);
    
    return res.json(product);
  }

  static update = async (req, res) => {
    const { codes } = req.body;
    // Set mandatory fields
    const createProductQuery = {};
    req.body.category = req.body.categoryId 
    req.body.brand = req.body.brandId 
    // Set optional fields, if provided
    const optionalFields = [
      { key: 'buy_price', convert: parseFloat },
      { key: 'wholesale_price', convert: parseFloat, default: 0.00 },
      { key: 'retail_price', convert: parseFloat, default: 0.00 },
      { key: 'category', convert: (id) => ({ connect: { id: parseInt(id) } }), default: null },
      { key: 'brand', convert: (id) => ({ connect: { id: parseInt(id) } }), default: null },
      { key: 'description', convert: (value) => value, default: null },
      { key: 'unity', convert: (value) => value, default: null },
      { key: 'stockAlert', convert: parseFloat, default: null },
    ];

    for (const field of optionalFields) {
      const value = req.body[field.key];
      if (value !== undefined) {
        createProductQuery[field.key] = field.convert(value) ?? field.default;
      }
    }

    const product = await Product.update(req.params.id, createProductQuery, codes);

    return res.json(product);
  }

  static delete = async (req, res) => {
    return res.json(await Product.softDelete(req.params.id));
  }
}

module.exports = ProductController;