// models/Product.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class Service {
  constructor(data) {
    /** Fields */
    this.id = parseInt(data.id);
    this.name = data.name;
    this.description = data.description;
    this.companyId = data.companyId;
    this.sell_price = data.sell_price;
    /** Timestamps fields */
    this.updatedAt = data.updatedAt;
    this.createdAt = data.createdAt;
    /** Deleted Field */
    this.deleted = data.deleted;
    /** Relations */
    this.saleServices = data.saleServices;
  }

  /** Read Methods */
  static getAll = async (companyId, whereQuery) => {
    const services = await prisma.service.findMany({
      where: {
        companyId: parseInt(companyId),
        deleted: 0,
        AND: whereQuery
      },
    });
    return services.map(service => new Service(service));
  }

  static findById = async (id) => {
    const service = await prisma.service.findFirst({
      where: { id: parseInt(id), 
        deleted: 0 
      }
    });
    return service;
  }

  static findBySaleServicetId = async (saleServiceId) => {
    const saleService= await prisma.saleService.findFirst({ where: { id: parseInt(saleServiceId) }, include: { service: true } });
    return saleService.service;
  }

  static findByName = async (name) => {
    const service = await prisma.service.findFirst({
      where: {
        deleted: 0,
        name: name,
      },
    });
    return new Service(service);
  }

  static exists = async (nom, companyId) => {
    const namesCount = await prisma.service.count({
      where: {
        companyId: parseInt(companyId),
        name: nom ,
      }
    });
    return (namesCount > 0) ?? false;
  }

  /** Create Methods */
  static create = async (data, companyId) => {
    data.company = { connect: { id: parseInt(companyId) } };

    const service = await prisma.service.create({ data: data });

    return new Service(service);
  }

  

  /** Update Methods */
  static update = async (id, data) => {
    // data.company = { connect: { id: parseInt(companyId) } }s;
    const service = await prisma.service.update({
      where: { id:  parseInt(id) },
      data: data
    });
    
    return await Service.findById(service.id);
  }

  /** Delete Methods */
  static delete = async (id) => {
    return await prisma.service.update({  where: { id: parseInt(id) }, data: { deleted: 1 }});
  }


}

module.exports = Service;