// models/Complaint.js
const { PrismaClient, ComplaintPriority, ComplaintStatus } = require('@prisma/client');
const dayjs = require('dayjs');
const prisma = new PrismaClient();

class Complaint {
  static findById = async (id, companyId) => {
    const complaint = await prisma.complaint.findFirst({
      where: { id: parseInt(id), companyId: parseInt(companyId)},
      include: {
        problems: {
          include: { asignees: true }
        }
      }
    });
    return complaint;
  }

  static getAll = async (companyId) => {
    const complaints = await prisma.complaint.findMany({
      where: { companyId: parseInt(companyId) },
      include: { problems: { include: { asignees: true } } },
      orderBy: { closeDate: 'asc' }
    });
    return complaints;
  }

  static findByUserId = async (userId) => {
    const complaints = await prisma.complaint.findMany({
      where: {
        problems: {
          some: { 
            asignees: { some: { userId: parseInt(userId) } }
          }
        }
      },
      include: { problems: { include: { asignees: true } } }
    });
    return complaints;
  }

  static insert = async (complaint, companyId) => {
    delete complaint.id;
    complaint.closeDate = !!complaint.closeDate ? dayjs(complaint.closeDate).toDate():undefined
    complaint.openDate = !!complaint.openDate ? dayjs(complaint.openDate).toDate():undefined
    return await prisma.complaint.create({
      data: {
        companyId: parseInt(companyId),
        ...complaint
      }
    });
  }

  static update = async (complaintId, complaint) => {
    delete complaint.problems;
    delete complaint.id;
    complaint.closeDate = !!complaint.closeDate ? dayjs(complaint.closeDate).toDate():undefined
    complaint.openDate = !!complaint.openDate ? dayjs(complaint.openDate).toDate():undefined

    return await prisma.complaint.update({
      where: { id: parseInt(complaintId) },
      data: complaint,
    });
  }

  static delete = async (complaintId) => {
    return await prisma.complaint.delete({ where: { id: parseInt(complaintId) } });
  }
}

module.exports = Complaint