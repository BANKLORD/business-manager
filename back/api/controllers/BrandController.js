// controllers/BrandController.js

const Brand = require('../models/Brand');

class BrandController {
  
  index = async (req, res) => {
    return res.json(await Brand.findAll(req.headers.company));
  }

  create = async (req, res) => {
    const { name } = req.body
    if ( await Brand.findByName(name, req.headers.company) )
      return res.status(422).json('No duplicated names allowed');
    const brand = await Brand.create({ name: name, companyId: req.user.companyId });
    return res.json(brand);
  }

  update = async (req, res) => {
    const { name } = req.body;
    const brand = await Brand.update(req.params.id, {name: name});
    return res.json(brand);
  }

  delete = async (req, res) => {
    return res.json(await Brand.delete(req.params.id, req.user.companyId))
  }
}
module.exports = BrandController