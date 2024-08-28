// models/Category.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class Category {
  constructor(data) {
    /** Fields */
    this.id = parseInt(data.id);
    this.name = data.name;
    this.companyId = data.companyId;
    /** Timestamps fields */
    this.updatedAt = data.updatedAt;
    this.createdAt = data.createdAt;
    /** Deleted Field */
    this.deleted = data.deleted;
    /** Relations */
    this.products = data.products;
    this.logs = data.logs;
  }

  static async findFirst(categoryId, ICE) {
    const category = await prisma.category.findFirst({
      where: {
        id: parseInt(categoryId),
        company: { ICE: ICE }
      },
      include: {
        products: true
      }
    });
    return new Category(category);
  }

  static async findAll(ICE) {
    const categories = await prisma.category.findMany({
      where: {
        company: { ICE: ICE }
      }
    });
    return categories.map(category => new Category(category));
  }

  static async create(data) {
    const category = await prisma.category.create({ data: data });
    return new Category(category);
  }

  static async update(id, data) {
    const category = await prisma.category.update({
      where: { id: parseInt(id) },
      data: data
    });
    return new Category(category); 
  }

  static async delete(categoryId, ICE) {
    const category = await this.findFirst(categoryId, ICE);
    if ( category.products?.length > 0 ) {
      await prisma.category.delete({
        where: { id: categoryId }
      })
      return true;
    }
    await prisma.category.update({
      where: { id: parseInt(categoryId) },
      data: { deleted: 1 }
    });
    return true;
  }

  static async exists(categoryName, ICE) {
    const count = await prisma.category.count({ where: {
      name: categoryName,
      deleted: { lt: 1 },
      company: { ICE: ICE }
    } });

    return (count > 0)?true:false;
  }
}

module.exports = Category