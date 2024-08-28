// controllers/BrandController.js

const Company = require('../models/Company');

class CompanyController {
  static types = async (req, res) => {
    return res.json(Company.getIndustryTypes());
  }

  static getCompany = async (req, res) => {
    return res.json(await Company.findById(req.user.companyId));
  }

  static createOrUpdate = async (req, res) => {
    if ( req.params.id )
      return res.json(await Company.update(req.params.id, req.body.company, req.body.settings));
    if (await Company.exists({ ICE: req.body.company.ICE }))
      return res.status(422).json('duplicate ICE not allowed');
    console.log("hello there")
    return res.json(await Company.create(req.body.company, req.body.settings))
  }

  static index = async (req, res) => {
    if ( req.params.id )
      return res.json(await Company.findById(req.params.id));
    return res.json(await Company.getAll());
  }
  static getUsers = async (req,res)=> {
    const id = parseInt(req.params.id);
    try{
      const company = await Company.findById(id)
      if (!company)
        return res.status(404).json({
          ok: false,
          message: 'Company with the provided id doesn\'t exist',
        })
      const users = await company.getUsers()
      return res.status(200).json({
        ok: true,
        data: users,
      })
    }catch (err) {
      return res.status(500).json({
        ok: false,
        message: 'Internal Server Error.',
      })
    }
  }
  static getRoles = async (req,res)=> {
    const id = parseInt(req.params.id);
    try{
      const company = await Company.findById(id)
      if (!company)
        return res.status(404).json({
          ok: false,
          message: 'Company with the provided id doesn\'t exist',
        })
      const roles = await company.getRoles()
      return res.status(200).json({
        ok: true,
        data: roles,
      })
    }catch (err) {
      return res.status(500).json({
        ok: false,
        message: 'Internal Server Error.',
      })
    }
  }

  static disable = async (req, res) => {
    const company = await Company.findById(req.params.id);
    return res.json(await company.disable());
  }

  static activate = async (req, res) => {
    const company = await Company.findById(req.params.id);
    return res.json(await company.activate());
  }
}

module.exports = CompanyController;
