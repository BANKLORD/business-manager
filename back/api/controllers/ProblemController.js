// controllers/ComaplaintController.js

const Problem = require('../models/Problem');

class ProblemController {
  static index = async (req, res) => {
    if ( req.params.id ) {
      return res.json(await Problem.findById(req.params.id, req.user.companyId));
    }
    return res.json(await Problem.getAll(req.user.companyId));
  }

  static getComplaintProblems = async (req, res) => {
    return res.json(await Problem.findByComplaintId(req.params.id));
  }

  static create = async (req, res) => {
    console.log(req.body);
    return res.json(await Problem.insert(req.body, req.user.companyId));
  }

  static update = async (req, res) => {
    return res.json(await Problem.update(req.params.id, req.body));
  }

  static delete = async (req, res) => {
    return res.json(await Problem.delete(req.params.id));
  }
}

module.exports = ProblemController;