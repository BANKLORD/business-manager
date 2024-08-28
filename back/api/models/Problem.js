// models/Complaint.js
const { PrismaClient } = require('@prisma/client');
const dayjs = require('dayjs');
const prisma = new PrismaClient();
class Problem {
  static findById = async (id) => {
    return await prisma.problem.findFirst({
      where: { id: parseInt(id) },
      include: {
        complaint: true,
        asignees: true
      }
    });
  }

  static getAll = async (companyId) => {
    return await prisma.problem.findMany({
      where: { complaint: { companyId: parseInt(companyId) } },
      include: {
        asignees: true,
        complaint: true
      }
    });
  }

  static findByComplaintId = async (userId) => {
    return await prisma.problem.findMany({
      where: { asignees: { some: { userId: parseInt(userId) } } },
      include: {
        complaint: true,
        asignees: true,
      }
    });
  }

  static findByComplaintId = async (complaintId) => {
    return await prisma.problem.findMany({
      where: { complaint: { id: parseInt(complaintId) } },
      include: {
        complaint: true,
        asignees: true,
      }
    });
  }

  static insert = async (problem) => {
    delete problem.id;
    problem.closeDate = !!problem.closeDate ? dayjs(problem.closeDate).toDate():undefined;
    problem.openDate = !!problem.openDate ? dayjs(problem.openDate).toDate():undefined;
    problem.complaintId = parseInt(problem.complaintId);
    return await prisma.problem.create({ data: problem });
  }

  static update = async (problemId, problem) => {
    problem.closeDate = !!problem.closeDate ? dayjs(problem.closeDate).toDate():undefined;
    problem.openDate = !!problem.openDate ? dayjs(problem.openDate).toDate():undefined;
    problem.complaintId = parseInt(problem.complaintId);
    return await prisma.problem.update({where: { id: parseInt(problemId) }, data: problem });
  }

  static delete = async (problemId) => {
    return await prisma.problem.delete({ where: { id: parseInt(problemId) } });
  }
}

module.exports = Problem