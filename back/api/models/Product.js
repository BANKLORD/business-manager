// models/Product.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class Product {
  constructor(data) {
    /** Fields */
    this.id = parseInt(data.id);
    this.brandId = data.brandId;
    this.categoryId = data.categoryId;
    this.buy_price = data.buy_price;
    this.retail_price = data.retail_price;
    this.wholesale_price = data.wholesale_price;
    this.unity = data.unity;
    this.stockAlert = data.stockAlert;
    this.description = data.description;
    /** Timestamps fields */
    this.updatedAt = data.updatedAt;
    this.createdAt = data.createdAt;
    /** Deleted Field */
    this.deleted = data.deleted;
    /** Relations */
    this.brand = data.brand;
    this.category = data.category;
    this.productCodes = data.productCodes;
    this.purchaseProducts = data.purchaseProducts;
    this.inventories = data.inventories;
    this.saleProducts = data.saleProducts;
    this.saleServiceProducts = data.saleServiceProducts;
    this.logs = data.logs;
  }

  /** Read Methods */
  static getAll = async (companyId, whereQuery) => {
    const products = await prisma.product.findMany({
      where: {
        companyId: parseInt(companyId),
        deleted: 0,
        AND: whereQuery
      },
      
      include: {
        brand: true,
        category: true,
        productCodes: { orderBy: { id: 'asc' } },
      }
    });
    return products.map(product => new Product(product));
  }

  static findById = async (id) => {
    const product = await prisma.product.findFirst({
      where: { id: parseInt(id), deleted: 0 },
      include: {
        brand: true,
        category: true,
        productCodes: { orderBy: { id: 'asc' } },
      }
    });
    const inventory = await prisma.inventory.findMany({ where: { productId: product.id }, orderBy: { createdAt: 'desc' } });
    const inventoryOperations = await prisma.inventoryOperation.findMany({ where: { saleProduct: { productId: product.id } } });
    const refundOperations = await prisma.refundOperation.findMany({ where: { inventoryId: { in: inventory.map(inventory => inventory.id) } } });
    // const inventoryOperations = await prisma.inventoryOperation.findMany({ where: { inventoryId: { in: inventory.map(inventory => inventory.id) } } });
    product.inventory = inventory.reduce((acc, inventory) => acc + inventory.quantity, 0);
    product.inventoryOperations = inventoryOperations.reduce((acc, operation) => acc + operation.quantity, 0);
    product.refundOperations = refundOperations.reduce((acc, operation) => acc + operation.quantity, 0);
    product.restInventory = product.inventory + product.refundOperations - product.inventoryOperations; 
    product.lastPurchasePrice = inventory[0]?.price;
    product.averagePrice = inventory.reduce((acc, inventory) => acc + inventory.price, 0) / inventory.length;
    return product;
  }

  static findBySaleProductId = async (saleProductId) => {
    const saleProduct = await prisma.saleProduct.findFirst({ where: { id: parseInt(saleProductId) }, include: { product: true } });
    return saleProduct.product;
  }

  static findByName = async (code) => {
    const product = await prisma.product.findFirst({
      where: {
        deleted: 0,
        productCodes: { every: { code: code } }
      },
      include: {
        brand: true,
        category: true,
        productCodes: { orderBy: { id: 'asc' } },
      }
    });
    return new Product(product);
  }

  static getMovements = async (id) => {
    const product = await prisma.product.findFirst({
      where: { id: parseInt(id) },
      include: {
        brand: true,
        category: true,
        productCodes: { orderBy: { id: 'asc' } },
        saleProducts: {
          include: {
            sale: true,
            InventoryOperations: { include: { inventory: true } }
          }
        },
        purchaseProducts: {
          include: {
            inventories: true,
            purchase: { include: { concern: true } }
          }
        },
      }
    });

    product.quantityPurchased = product.totalPaid = product.quantitySold = product.totalSold = 0;
    product.inventories = [];

    for (const purchaseProduct of product.purchaseProducts) {
      const hasInventories = purchaseProduct.inventories.length > 0;
      if (hasInventories) {
        product.inventories.push(...purchaseProduct.inventories);
        product.quantityPurchased += parseFloat(purchaseProduct.quantity);
        product.totalPaid += parseFloat(purchaseProduct.price * purchaseProduct.quantity);
      } else {
        product.quantityPurchased += parseFloat(0);
        product.totalPaid += parseFloat(0);
      }
    }

    for (const saleProduct of product.saleProducts) {
      product.quantitySold += saleProduct.quantity;
      product.totalSold += saleProduct.price * saleProduct.quantity;
    }
    
    return product;
  }

  static exists = async (codes, companyId) => {
    const productCodesCount = await prisma.productCodes.count({
      where: {
        code: { in: codes.map(pCode => pCode.code) },
        product: { deleted: 0, company: { id: parseInt(companyId) } }
      }
    });
    return (productCodesCount > 0) ?? false;
  }

  static getInitalInventory = async (id) => {
    const product = await prisma.product.findFirst({
      where: { id: parseInt(id), deleted: 0 },
      include: { inventories: true }
    });
    return product.inventories.reduce((acc, inventory) => acc + inventory.quantity, 0);
  }

  static getSoldInventory = async (id) => {
    const product = await prisma.product.findFirst({
      where: { id: parseInt(id), deleted: 0 },
      include: { inventories: { include: { inventoryOperations: true } } }
    });

    return product.inventories.reduce(
      (acc, inventory) => acc + inventory.inventoryOperations.reduce((acc2, io) => acc2 + io.quantity, 0), 0
    );
  }

  static getRefundedInventory = async (id) => {
    const product = await prisma.product.findFirst({
      where: { id: parseInt(id), deleted: 0 },
      include: { inventories: { include: { refundOperations: true } } }
    });

    return product.inventories.reduce(
      (acc, inventory) => acc + inventory.refundOperations.reduce((acc2, ro) => acc2 + ro.quantity, 0), 0
    );
  }

  /** Create Methods */
  static create = async (data, codes, companyId) => {
    data.company = { connect: { id: parseInt(companyId) } };
    const product = await prisma.product.create({ data: data });

    // Create an array of objects containing the product ID and each code
    const codesData = codes.map(({ code }) => ({ productId: product.id, code }));
    // Create the product codes in the database, skipping duplicates
    await prisma.productCodes.createMany({ data: codesData, skipDuplicates: true });

    return new Product(product);
  }

  /** Update Methods */
  static update = async (id, data, codes) => {
    // data.company = { connect: { id: parseInt(companyId) } }s;
    const product = await prisma.product.update({
      where: { id:  parseInt(id) },
      data: data
    });
    // Create an array of objects containing the product ID and each code
    const codesData = codes.map(({ code }) => ({ productId: product.id, code }));
    // Create the product codes in the database, skipping duplicates
    await prisma.productCodes.deleteMany({ where: { product: { id: parseInt(id) } } });
    await prisma.productCodes.createMany({ data: codesData, skipDuplicates: true });
    return await Product.findById(product.id);
  }

  /** Delete Methods */
  static softDelete = async (id) => {
    return await prisma.product.update({ where: { id: parseInt(id) }, data: { deleted: 1 } });
  }

  static delete = async (id) => {
    return await prisma.product.update({ where: { id: parseInt(id) }, data: { deleted: 1 } });
  }

}

module.exports = Product;