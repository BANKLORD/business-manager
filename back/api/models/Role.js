const { PrismaClient } = require('@prisma/client');
const Permission = require("./Permission");
const prisma = new PrismaClient()

class Role {
    static async getAll(query) {
        return prisma.role.findMany({ where: query, include: { company: true } });
    }
    static async create({name, companyId, permissions}) {
        const createdRole = await prisma.role.create({
            data: {
                name,
                companyId
            }
        })
        let roles = [];
        for (let i = 0; i < permissions.length; i++) {
            roles.push({ roleId: createdRole.id, permissionId: permissions[i].id });
        }
        await prisma.roleHasPermission.createMany({
            data: roles,
            skipDuplicates: true,
        });
        return prisma.role.findUnique({
            where: { id: createdRole.id },
            include: { RoleHasPermissions: true }
        });
    }
    static async update({id, name, permissions}) {
        const updatedRole = await prisma.role.update({
            where: {
                id
            },
            data: {
                name: name
            }
        })

        await prisma.roleHasPermission.deleteMany({
            where: {
                roleId: id
            }
        })

        let roleHasPermissions = [];
        for (let i = 0; i < permissions.length; i++) {
            roleHasPermissions.push({ roleId: id, permissionId: permissions[i].id });
        }
        await prisma.roleHasPermission.createMany({
            data: roleHasPermissions,
            skipDuplicates: true,
        })

        return prisma.role.findUnique({
            where: {
                id: updatedRole.id
            },
            include: {
                RoleHasPermissions: true
            }
        })
    }
    static async getRolePermissions(id) {
        const permissions = []
        await prisma.roleHasPermission.findMany({
            where: {
                roleId: id
            }
        }).then(async res => {
            for (let i = 0; i < res.length; i++) {
                let permission = await Permission.findById(res[i].permissionId)
                permissions.push(permission)
            }
        });
        return permissions
    }
    static async remove(id) {
        await prisma.roleHasPermission.deleteMany({
            where: {
                roleId: id
            }
        });
        await prisma.userHasRole.deleteMany({
            where: {
                roleId: id
            }
        });
        return prisma.role.delete({
            where: {
                id
            }
        })
    }
}


module.exports = Role;
