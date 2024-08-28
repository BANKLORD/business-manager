// models/Product.js
const { PrismaClient } = require('@prisma/client');
const SaleProduct = require('./SaleProduct');
const prisma = new PrismaClient();
const SaleServiceController = require('../../controllers/sales/SaleServiceController')


class Sale {

  constructor(data) {
        
    this.id = parseInt(data.id);
    this.vat = data.vat;
    this.discount = data.discount;
    this.paid = data.paid;
    this.saleType = data.saleType;
    this.shipped = data.shipped;
    this.description = data.description;
    this.paymentMethod = data.paymentMethod;
    
    /** Timestamps fields */
    this.updatedAt = data.updatedAt;
    this.createdAt = data.createdAt;
    /** Deleted Field */
    this.deleted = data.deleted;
    /** Relations */
    this.company = data.company;
    this.concern = data.concern;
    this.user = data.user;
    this.deliveryForms = data.deliveryForms;
    this.saleProducts = data.saleProducts;
    this.purchaseOrders = data.purchaseOrders;
    this.salePayments = data.salePayments;
    this.saleServices = data.saleServices;
  }

  static getAll = async (companyId, whereQuery) => {
    console.log(whereQuery);
    const sales = await prisma.sale.findMany({
      where: {
          companyId: parseInt(companyId),
          AND: whereQuery
      },
      include: {
        saleServices: {
          include: {
            service: true,
            saleServiceProducts: {
              include: {
                product: {
                  include: { productCodes: { orderBy: { id: 'asc' } } }
                }
              }
            }
          }
        },
        concern: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    for (const sale of sales) {
      sale.total = 0;
      sale.total -= parseFloat(sale.discount ?? 0)
      for (const saleService of sale.saleServices) {
        sale.total += parseFloat(saleService.price) * parseFloat(saleService.quantity);
        if(saleService.saleServiceProducts){
          for(const saleServiceProduct of saleService.saleServiceProducts){
            sale.total +=  parseFloat(saleServiceProduct.price) * parseFloat(saleServiceProduct.quantity);
          }
        }
      }
        
      sale.totalPrice = sale.total + ( parseFloat(sale.total) * (parseFloat(sale.vat)) / 100 )
      sale.rest = parseFloat(sale.totalPrice) - parseFloat(sale.paid);
    }
    //return sales.map(sale => new Sale(sale));
    console.log(sales)
    return sales;
  }
  
  static findById = async (id) => {
    return await prisma.sale.findFirst({
      where: { id: parseInt(id) }
    });
  }
  
  /** Create Methods */
  static create = async (data, companyId) => {

    data.company = { connect: { id: parseInt(companyId) } };
    data.concern = { connect: { id: parseInt(data.concernId) } }

    delete data.concernId;
    
    console.log(data.services);

    const sale = await prisma.sale.create({ data: data });

    //await prisma.saleService.createMany({ data: data.services });
    //SaleServiceController.create(data.services);

    //await prisma.saleServiceProduct.createMany({ data: data.saleServiceProducts });

    return new Sale(sale);
  }


  /** Update Methods */
  static update = async (id, req) => {

    const { concernId, vat, description ,discount} =  req;
    const sale = await prisma.sale.update({
      where: { id: parseInt(id) },
      data: {
        concernId: parseInt(concernId),
        vat: parseInt(vat),
        discount: parseInt(discount),
        description: description,
        }
    });

    //data.concern = { connect: { id: parseInt(data.concernId) } }
    //delete data.concernId;
  
    
    return await Sale.findById(sale.id);
  }

  /** Delete Methods */
  static delete = async (id) => {
    return await prisma.sale.update({  where: { id: parseInt(id) }, data: { deleted: 1 }});
  }



  /** Create a Quotation */
  static createQuotation = async (saleData, companyId) => {
    const saleProducts = saleData.saleProducts.map(saleProduct => ({
      productPrice: parseFloat(saleProduct.price),
      price: parseFloat(saleProduct.price),
      quantity: parseFloat(saleProduct.quantity),
      type: saleProduct.type,
    }));

    return await prisma.sale.create({
      data: {
        companyId: parseInt(companyId),  // Company ID
        concernId: parseInt(saleData.concernId),  // Client ID
        description: saleData.description ?? undefined, // Description if exists
        discount: parseFloat(saleData.discount ?? 0), // Discount if there is any discount
        vat: parseFloat(saleData.vat),
        userId: parseInt(saleData.userId),
        saleProducts: {
          createMany: { data: saleProducts }
        }
      },
      include: { saleProducts: true }
    });
  }

  static createDeliveryForm = async (saleData, companyId) => {
    const quotation = await this.createQuotation(saleData, companyId);
    const saleProducts = quotation.saleProducts.map(saleProduct => ({
      id: parseFloat(saleProduct.id),
      productId: parseFloat(saleProduct.productId),
      productPrice: parseFloat(saleProduct.price),
      price: parseFloat(saleProduct.price),
      quantity: parseFloat(saleProduct.quantity),
      type: saleProduct.type,
    }));

    /** Create InventoryOperations from saleProducs */
    for (const saleProduct of saleProducts) {
      /**
       * Find all the inventories so we check how much we've got and how much is left
       * depends on the calculations of @operations - @refunds
      **/
      const inventories = await prisma.inventory.findMany({ where: { productId: saleProduct.productId }, include: { inventoryOperations: true, refundOperations: true } });
      saleProduct.inventoryOperations = [];
      var quantityInSaleProduct = saleProduct.quantity;
      /** looping the array of inventories  */
      for (const [index, inventory] of inventories.entries()) {
        if ( quantityInSaleProduct <= 0 ) break;
        const inventoryOperationsQuantity = inventory.inventoryOperations.reduce((acc, operation) => acc + operation.quantity ,0)
        const refundOperationsQuantity = inventory.refundOperations.reduce((acc, operation) => acc + operation.quantity ,0)
        const inventoryRestQuantity = (inventory.quantity + refundOperationsQuantity) - inventoryOperationsQuantity
        if ( inventoryRestQuantity >=  quantityInSaleProduct ) {
          saleProduct.inventoryOperations.push({
            saleProductId: saleProduct.id,
            inventoryId: inventory.id,
            quantity: quantityInSaleProduct
          });
          quantityInSaleProduct = 0;
          break;
        } else {
          if( index == (inventories.length - 1) ) {
            saleProduct.inventoryOperations.push({
              saleProductId: saleProduct.id,
              inventoryId: inventory.id,
              quantity: quantityInSaleProduct
            });
            quantityInSaleProduct -= inventoryRestQuantity;
            saleProduct.inventoryOperations.push({
              saleProductId: saleProduct.id,
              inventory: {
                create: {
                  ref: "",
                  price: saleProduct.productPrice,
                  productId: saleProduct.productId,
                  quantity: quantityInSaleProduct
                }
              },
              quantity: quantityInSaleProduct
            });
          } else {
            saleProduct.inventoryOperations.push({
              saleProductId: saleProduct.id,
              inventoryId: inventory.id,
              quantity: restQuantity
            });
            quantityInSaleProduct -= inventoryRestQuantity;
          }
        }
      }
    }
    await prisma.inventoryOperation.create({
      data: {
        inventory: {
          create: {

          }
        }
      }
    })
  } 
}

module.exports = Sale;