// models/Complaint.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class ProblemAssignee {
  static insert = async (problemAssignee) => {
    return await prisma.problemAssignee.create({ data: problemAssignee });
  }

  static update = async (problemAssigneeId, problemAssignee) => {
    return await prisma.problem.update({where: { id: parseInt(problemAssigneeId) }, data: problemAssignee });
  }

  static delete = async (problemAssigneeId) => {
    return await prisma.problem.delete({ where: { id: parseInt(problemAssigneeId) } });
  }
}

module.exports = ProblemAssignee