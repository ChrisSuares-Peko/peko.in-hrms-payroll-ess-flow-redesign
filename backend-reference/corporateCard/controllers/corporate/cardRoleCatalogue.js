const asyncHandler = require('../../middlewares/async')
const { listRolePresets, CATALOGUE_VERSION } = require('../../utils/cardRoles')

exports.listRoles = asyncHandler(async (req, res) => {
    const rows = listRolePresets()
    return res.status(200).json({
        status: true,
        message: 'Roles fetched.',
        data: { version: CATALOGUE_VERSION, count: rows.length, rows },
        responseCode: '000',
    })
})
