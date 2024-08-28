// controllers/ClientController.js
const Concern = require('../models/Concern');
class ClientController {
  static clientsAnalytics = async (req, res) => {
    const clients = await Concern.clientsAnalytics(req.user.companyId, req.query.searchTerm);
    for (const client of clients) {
      client.totalInSales = client.sales.reduce(
        (acc, sale) => acc + sale.saleProducts.reduce(
          (acc, saleProduct) => acc + (saleProduct.price * saleProduct.quantity) 
        , 0)
      , 0)
    }
    return res.json(clients);
  }

  static clientProfit = async (req, res) => {
    const sales = await Concern.clientProfit(req.params.id, req.query.timeRange);
    const groupedSales = sales.reduce((acc, curr) => {
      const date = curr.createdAt.toISOString().substring(0, 10);
      const profit = curr.saleProducts.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
  
      if (!acc[date]) {
        acc[date] = { day: date, profit: profit };
      } else {
        acc[date].profit += profit;
      }
  
      return acc;
    }, {});
  
    const profitPerDay = Object.values(groupedSales);
    return res.json(profitPerDay);
  }
}

module.exports = ClientController