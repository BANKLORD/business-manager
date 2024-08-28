// controllers/ProductController.js

const dayjs = require('dayjs');
const Inventory = require('../models/Inventory');

class InventoryController {
  static getInventoryStatus = async (req, res) => {
    const { searchTerm, categoryId, brandId, concernId, startDate, endDate } = req.query;

    if ( req.params.id ) {
      const product = await Inventory.getAllMovementsByProductId(req.params.id);
      product.in = product.inventories.reduce((acc, inventory) => acc + inventory.quantity, 0);
      product.out = product.saleProducts.map(
        saleProduct => saleProduct.InventoryOperations.reduce((acc, operation) => acc + operation.quantity, 0)
      ).reduce((acc, quantity) => acc + quantity, 0)
      product.refunded = product.inventories.map(
        inventory => inventory.refundOperations.reduce((acc, operation) => acc + operation.quantity, 0)
      ).reduce((acc, quantity) => acc + quantity, 0);
      product.investments = product.inventories.reduce((acc, inventory) => acc + (inventory.price * inventory.quantity), 0);
      product.profit = product.saleProducts.reduce((acc, sale) => acc + (sale.price * sale.quantity), 0);
      product.pnl = product.investments - product.profit;
      return res.json(product);
    }

    const products = await Inventory.getAllMovements(
      req.user.companyId,
      categoryId,
      brandId,
      concernId,
      searchTerm,
      dayjs(startDate).startOf('day').toDate(),
      dayjs(endDate).endOf('day').toDate(),
    );
    for (const product of products) {
      product.in = product.inventories.reduce((acc, inventory) => acc + inventory.quantity, 0);
      product.out = product.saleProducts.map(
        saleProduct => saleProduct.InventoryOperations.reduce((acc, operation) => acc + operation.quantity, 0)
      ).reduce((acc, quantity) => acc + quantity, 0)
      product.refunded = product.inventories.map(
        inventory => inventory.refundOperations.reduce((acc, operation) => acc + operation.quantity, 0)
      ).reduce((acc, quantity) => acc + quantity, 0);
      product.investments = product.inventories.reduce((acc, inventory) => acc + (inventory.price * inventory.quantity), 0);
      product.profit = product.saleProducts.reduce((acc, sale) => acc + (sale.price * sale.quantity), 0);
      product.pnl = product.investments - product.profit;
    }
    return res.json(products);
  }
}

module.exports = InventoryController