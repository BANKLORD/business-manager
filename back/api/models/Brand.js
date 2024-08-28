// models/Brand.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class Brand {
  constructor(data) {
    /** Fields */
    this.id = parseInt(data.id);
    this.name = data.name;
    this.companyId = data.companyId;
    /** Timestamp fields */
    this.updatedAt = data.updatedAt;
    this.createdAt = data.createdAt;
    /** Deleted Field */
    this.deleted = data.deleted;
    /** Relations */
    this.products = data.products;
    this.logs = data.logs;
  }

  static async findFirst(brandId, ICE) {
    const brand = await prisma.brand.findFirst({
      where: {
        id: parseInt(brandId),
        company: { ICE: ICE }
      },
      include: {
        products: true
      }
    });
    return new Brand(brand);
  }

  static async findByName(brandName, ICE) {
    const brand = await prisma.brand.findFirst({
      where: {
        name: parseInt(brandName),
        company: { ICE: ICE }
      },
      include: {
        products: true
      }
    });
    return new Brand(brand);
  }

  static async findAll(ICE) {
    const categories = await prisma.brand.findMany({
      where: {
        company: { ICE: ICE }
      }
    });
    return categories.map(brand => new Brand(brand));
  }

  static async create(data) {
    const brand = await prisma.brand.create({ data: data });
    return new Brand(brand);
  }

  static async update(id, data) {
    const brand = await prisma.brand.update({
      where: { id: parseInt(id) },
      data: data
    });
    return new Brand(brand); 
  }

  static async delete(brandId, ICE) {
    const brand = await this.findFirst(brandId, ICE);
    if ( brand.products?.length > 0 ) {
      await prisma.brand.delete({
        where: { id: brandId }
      })
      return true;
    }
    await prisma.brand.update({
      where: { id: parseInt(brandId) },
      data: { deleted: 1 }
    });
    return true;
  }

  static async exists(brandName, ICE) {
    const count = await prisma.brand.count({ where: {
      name: brandName,
      deleted: { lt: 1 },
      company: { ICE: ICE }
    } });

    return (count > 0)?true:false;
  }
}

module.exports = Brand