const Role = require('../models/Role')
const index = async (req, res) => {
    const whereQuery = {};
    if ( req.query.companyId )
        whereQuery.companyId = parseInt(req.query.companyId)
    const roles = Role.getAll(whereQuery);
    res.json(roles)
}
const create = async (req, res) => {
    const { name, companyId, permissions} = req.body;
    if ( !name )
        return res.status(422).json('Missing field: Name')
    try {
        const role = await Role.create({name, companyId, permissions});
        res.json(role)
    }catch (err) {
        if (err.code === 'P2002') {
            return res.status(409).json({
                ok: false,
                message: 'Role already exist with the same name.',
            })
        }
        return res.status(500).json({
            ok: false,
            message: 'Internal Server Error.',
        })
    }
}
const update = async(req, res) => {
    const { name, permissions } = req.body;
    const id = parseInt(req.params.id)
    if ( !name )
        res.status('422').json('Missing field: Name')

    try {
        const updatedRole = await Role.update({id, name, permissions})
        if ( !updatedRole ) return res.status(422).json('Role not found')
        res.json(updatedRole)

    }catch (err) {
        if (err.code === 'P2002') {
            return res.status(409).json({
                ok: false,
                message: 'Role already exist with the same name.',
            })
        }
        res.status(500).json('Internal Server Error')
    }
}
const getRolePermissions = async (req, res) => {
    const id = parseInt(req.params.id)
    if ( !id ) return res.status(422).json('Please specify a role id')
    const permissions = await Role.getRolePermissions(id)
    res.status(200).json(permissions)
}
const remove = async (req, res) => {
    const roleId = parseInt(req.params.id)
    try{
        const deletedRole = Role.remove(roleId)
        if (!deletedRole)
            res.status(404).json({
                ok: false,
                message: 'Role not found'
            })
        res.status(200).json({
            ok: true,
            message: 'Role deleted successfully'
        });
    }catch (err) {
        res.status(500).json({
            ok: true,
            message: 'Internal Server Error'
        });
    }
}

module.exports = {index, create, update, getRolePermissions, remove}
