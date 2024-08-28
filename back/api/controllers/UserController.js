const User = require('../models/User')
const index = async (req,res) => {
    const whereQuery = {};
    if ( req.query.companyId )
        whereQuery.companyId = parseInt(req.query.companyId)
    let users = await User.getAll(whereQuery)
    for (const user of users) {
        user.role = user.userHasRoles[0]?.role;
    }
    return res.json(users)
}
const create = async (req, res) => {
    const { username, password, companyId, role } = req.body
    try {
        const user = await User.create({
            username: username,
            password: password,
            companyId: companyId,
            userHasRoles: { create: { roleId: role } }
        })
        return res.json(user)
    }catch (err) {
        if (err.code === 'P2002') {
            return res.status(409).json({
                ok: false,
                message: 'User already exist with the same username.',
            })
        }
        res.status(500).json('Internal Server Error')
    }
}
const update = async (req, res) => {
    const { username, password, role } = req.body
    const userId = parseInt(req.params.id)
    try {
        const  user = await User.update({
            userId,
            username,
            password,
            role
        })
        return res.json(user)
    }catch (err) {
        if (err.code === 'P2002') {
            return res.status(409).json({
                ok: false,
                message: 'User already exist with the same username.',
            })
        }
        res.status(500).json('Internal Server Error')
    }
}
const getUserRole = async (req, res) => {
    const userId = parseInt(req.params.id)
    const role = await User.getUserRoleByUserId(userId)
    return res.json(role);
}

module.exports = {index, create, update, getUserRole}
