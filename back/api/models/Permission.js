const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient()

class Permission {
    static async getAll() {
        return prisma.permission.findMany();
    }
    static async findById(id) {
        return prisma.permission.findFirst({ where: { id }})
    }
    static async create(permission) {
        return prisma.permission.create({
            data: permission
        })
    }
    static async update({id, name}) {
        return  prisma.permission.update({
            where: {
                id
            },
            data: {
                name: name
            }
        })
    }
    static async remove(id) {
        return prisma.permission.delete({
            where: {
                id,
            },
        });
    }
}


module.exports = Permission;
