const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient()

class User {
    static async getAll(Query) {
        return prisma.user.findMany({
            where: Query,
            include: {
                company: true,
                userHasRoles: { include: { role: true } }
            }
        })
    }
    static async create(user) {
        return prisma.user.create({
            data: user
        })
    }
    static async update({userId, username, password, role}) {
        let user = await prisma.user.update({
            where: {
                id: userId
            },
            data: password && password.trim() ?
                {
                username: username,
                password: password,
                } :
                {
                    username: username,
                },
        })
        if ( role > 0 ) {
            const userHasRoleToUpdate = await prisma.userHasRole.findFirst({ where: { userId: userId } });
            userHasRoleToUpdate ?
                await prisma.userHasRole.update({ where: { id: userHasRoleToUpdate.id }, data: { roleId: role } }) :
                await prisma.userHasRole.create({data: {roleId: role, userId}})
        }
        return user
    }
    static async getUserRoleByUserId(userId) {
        return prisma.userHasRole.findFirst({where: {userId: userId}}).role();
    }
}


module.exports = User;
