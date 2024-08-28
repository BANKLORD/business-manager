// models/Product.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class SaleServiceProduct {
  constructor(data) {
    
    /** Fields */
    this.id = parseInt(data.id);
    this.quantity = data.quantity;
    this.price = data.price;
    this.description = data.description;
    this.reference = this.reference;
    /** Timestamps fields */
    this.updatedAt = data.updatedAt;
    this.createdAt = data.createdAt;
    /** Relations */
    this.saleService = data.saleService;
    this.product = data.product;
  }

  /** Read Methods */
  static getAll = async (companyId, whereQuery) => {
    const saleServices = await prisma.saleService.findMany({
      where: {
        sale: {
          companyId: parseInt(companyId)
        },
        AND: whereQuery
      },
    });
    return saleServices.map(saleService => new Service(saleService));
  }

  static findById = async (id) => {
    const saleService = await prisma.saleService.findFirst({
      where: { 
        id: parseInt(id), 
      }
    });
    return saleService;
  }
  
  /** Create Methods */
  static create = async (data, companyId) => {

    const saleServiceIds = data.saleSerivce || [];
    
    //data.services.service = { connect: { id: parseInt(data.saleServiceId) } };
    const i = 0;
    console.log(data.services[0].saleProducts)
    console.log(saleServiceIds.length)
    for(let i = 0; i < data.saleSerivce.length; i++){
      const saleServiceId = data.saleSerivce[i];
      console.log(i)
      for (const saleProducts of data.services[i].saleProducts){
        const productData = {}; 
        //serviceData.saleId;
        productData.saleService = { connect: { id: parseInt(saleServiceId) } }
        productData.product = { connect: { id: parseInt(saleProducts.productId) } };
        productData.quantity = parseFloat(saleProducts.quantity);
        productData.price = parseFloat(saleProducts.price);
        productData.description = data.description;

        
        const saleServiceProduct = await prisma.saleServiceProduct.create({ data: productData });


        new SaleServiceProduct(saleServiceProduct);

      }
    }
    return true;
  }

  /** Update Methods */
  static update = async (id, data) => {
    // data.company = { connect: { id: parseInt(companyId) } }s;
    const saleService = await prisma.saleService.update({
      where: { id:  parseInt(id) },
      data: data
    });
    
    return await SaleService.findById(saleService.id);
  }

  /** Delete Methods */
  static delete = async (id) => {
    return await prisma.saleService.delete({  where: { id: parseInt(id) },});
  }


}

module.exports = SaleServiceProduct;