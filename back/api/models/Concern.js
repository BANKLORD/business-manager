// models/Product.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class Concern {
  static clientsAnalytics = async (companyId, searchTerm) => {
    const clients = await prisma.concern.findMany({
      where: {
        ...(searchTerm && { companyName: { contains: searchTerm } }),
        companyId: parseInt(companyId),
        type: 'Client'
      },
      include: {
        sales: {
          where: { deliveryForms: { some: { id: { gt: 0 } } } },
          include: { saleProducts: true }
        }
      }
    });
    return clients;
  }

  static clientProfit = async (clientId, timeRange) => {
    // const timeRange = 'this_year';
    const startOfLast24Hrs = new Date(new Date().setDate(new Date().getDate() - 1));
    const startOfLastWeek = new Date(new Date().setDate(new Date().getDate() - 7));
    const startOfLast30Days = new Date(new Date().setDate(new Date().getDate() - 30));
    const startOfThisYear = new Date(new Date().getFullYear(), 0, 1);

    const sales = await prisma.sale.findMany({
      where: {
        AND: [
          { concernId: parseInt(clientId) },
          { deliveryForms: { some: { id: { not: undefined } } } },
          {
            createdAt: {
              gte: timeRange === 'last_24_hours' ? startOfLast24Hrs :
                  timeRange === 'last_week' ? startOfLastWeek :
                  timeRange === 'last_30_days' ? startOfLast30Days :
                  timeRange === 'this_year' ? startOfThisYear :
                  new Date(0) // all time
            }
          }
        ]
      },
      select: {
        createdAt: true,
        saleProducts: {
          select: {
            price: true,
            quantity: true
          }
        }
      }
    });

    return sales;
  }

  static getAllClients = async (companyId) => {
    const clients = await prisma.concern.findMany({
      where: { companyId: parseInt(companyId), type: 'Client' }
    });
    return clients;
  }

}

module.exports = Concern;