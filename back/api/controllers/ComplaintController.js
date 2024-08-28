// controllers/ComaplaintController.js

const Complaint = require('../models/Complaint');

class ComplaintController {
  static index = async (req, res) => {
    if ( req.params.id ) {
      return res.json(await Complaint.findById(req.params.id, req.user.companyId));
    }
    return res.json(await Complaint.getAll(req.user.companyId));
  }

  static getUserComplaints = async (req, res) => {
    return res.json(await Complaint.findByUserId(req.params.id));
  }

  static create = async (req, res) => {
    console.log(req.body);
    return res.json(await Complaint.insert(req.body, req.user.companyId));
  }

  static update = async (req, res) => {
    return res.json(await Complaint.update(req.params.id, req.body));
  }

  static delete = async (req, res) => {
    return res.json(await Complaint.delete(req.params.id));
  }
}

module.exports = ComplaintController;