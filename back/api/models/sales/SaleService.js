// models/Product.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class SaleService {
  constructor(data) {
    
    /** Fields */
    this.id = parseInt(data.id);
    this.quantity = data.quantity;
    this.price = data.price;
    this.servicePrice = data.servicePrice;
    this.description = data.description;
    /** Timestamps fields */
    this.updatedAt = data.updatedAt;
    this.createdAt = data.createdAt;
    /** Deleted Field */
    this.deleted = data.deleted;
    /** Relations */
    this.saleServiceProducts = data.saleServiceProducts;
    this.sale = data.sale;
    this.service = data.service;
    this.company = data.company;

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
    return saleServices.map(saleService => new SaleService(saleService));
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
    //data.company = { connect: { id: parseInt(companyId) } };
    const SaleServiceIds = []; 

    data.sale = { connect: { id: parseInt(data.saleId) } };

    for (const service of data.services){
      const serviceData = {}; 
      //serviceData.saleId;
      serviceData.sale = data.sale;
      serviceData.service = { connect: { id: parseInt(service.serviceId) } };
      serviceData.description = data.description;
      serviceData.quantity = parseFloat(service.quantity);
      serviceData.price = parseFloat(service.price);
      
      const saleService = await prisma.saleService.create({ data: serviceData });

      new SaleService(saleService);

      SaleServiceIds.push(saleService.id);

      //await prisma.saleServiceProduct.createMany({ data: service.saleProducts });
    }

    return SaleServiceIds;
    
  }


  /** Update Methods */
  static update = async (id, data) => {
    // data.company = { connect: { id: parseInt(companyId) } }s;
    delete data.params;
    const saleService = await prisma.saleService.update({
      where: { id:  parseInt(id) },
      data: data
    });
    
    //return await SaleService.findById(saleService.id);
  }

  /** Delete Methods */
  static delete = async (id) => {
    return await prisma.saleService.delete({  where: { id: parseInt(id) },});
  }


}

module.exports = SaleService;