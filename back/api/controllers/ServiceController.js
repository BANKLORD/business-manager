// controllers/ProductController.js

const Service = require('../models/Service');

class ServiceController {
  static index = async (req, res) => {
    if ( req.params.id )
      return res.json(await Service.findById(req.params.id));

    const { searchTerm, name} = req.query;
    const whereQueryBuilder = {};
    if ( searchTerm )
      whereQueryBuilder.name = { contains: searchTerm } 
    
    if ( name )
      whereQueryBuilder.name = { every: { name: name } }

    return res.json(await Service.getAll(req.user.companyId, whereQueryBuilder));

  }

  static create = async (req, res) => {
    const { name } = req.body;
    if ( await Service.exists(name, req.user.companyId) )
      return res.status(422).json("Le nom que vous essayez d'insérer existe déjà dans les enregistrements");

    //if ( await Service.findByName(name) )
    //  return res.status(422).json("Le nom que vous essayez d'insérer existe déjà dans les enregistrements");

    // Set mandatory fields
    const createServiceQuery = {};
    // Set optional fields, if provided
    const optionalFields = [
      { key: 'name', convert: (value) => value, default: null},
      { key: 'description', convert: (value) => value, default: null },
      { key: 'sell_price', convert: parseFloat, default: null },
    ];

    for (const field of optionalFields) {
      const value = req.body[field.key];
      if (value !== undefined) {
        createServiceQuery[field.key] = field.convert(value) ?? field.default;
      }
    }

    const service = await Service.create(createServiceQuery, req.user.companyId);
    
    return res.json(service);
  }

  static update = async (req, res) => {
    // Set mandatory fields
    const createServiceQuery = {};
    // Set optional fields, if provided
    const optionalFields = [
      { key: 'name', convert: (value) => value, default: null},
      { key: 'description', convert: (value) => value, default: null },
      { key: 'sell_price', convert: parseFloat, default: null },
    ];

    for (const field of optionalFields) {
      const value = req.body[field.key];
      if (value !== undefined) {
        createServiceQuery[field.key] = field.convert(value) ?? field.default;
      }
    }

    const service = await Service.update(req.params.id, createServiceQuery);

    return res.json(service);
  }

  static delete = async (req, res) => {
    const { id } = req.params;
    return res.json(await Service.delete(req.params.id));
  }
}

module.exports = ServiceController;