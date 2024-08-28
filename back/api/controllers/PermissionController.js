const Permission = require('../models/Permission')
const index = async (req, res) => {
    try{
        const permissions = await Permission.getAll();
        res.json({
            ok: true,
            data: permissions
        })
    }catch (err) {
        res.status(500).json({
            ok: false,
            message: 'Internal server Error'
        })
    }
}
const create = async (req, res) => {
    const { name } = req.body;
    if (!name)
        return res.status(422).json({
            ok: false,
            message: 'Missing field: Name' });

    try {
        const permission = await Permission.create({ name });
        return res.status(200).json({
            ok: true,
            message: "Permission created successfully",
            data: permission
        });
    } catch (err) {
        if (err.code === 'P2002') {
            return res.status(409).json({
                ok: false,
                message: 'Permission already exist with the same name.',
            })
        }
        return res.status(500).json({
            ok: false,
            message: 'Internal Server Error.',
        })
    }
};
const update = async (req, res) => {
    const id = parseInt(req.params.id);
    const { name } = req.body;
    if (!name)
        return res.status(422).json({
            ok:false,
            message: "Missing field: Name"
    });

    try {
        const updatedPermission = await Permission.update({ id, name });
        if (!updatedPermission)
            return res.status(404).json({
                ok:false,
                message: "Permission not found"
        });
        return res.json({
            ok:true,
            message: "Permission updated successfully",
            data: updatedPermission
        });
    } catch (error) {
        return res.status(500).json({
            ok: false,
            message: 'Internal Server Error'
        });
    }
};

const remove = async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const deletedPermission = await Permission.remove(id);
        if (!deletedPermission) {
            return res.status(404).json({
                ok: false,
                message: 'Role not found'
            });
        }
        return res.status(204).end();
    } catch (error) {
        return res.status(500).json({
            ok: false,
            message: 'Internal Server Error'
        });
    }
};

module.exports = {index, create, update, remove}
