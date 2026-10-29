const asyncHandler = require('../../middlewares/async')
const setting = require('../entities/setting')

const findByName = asyncHandler(async (name) => setting.findOne({ where: { name } }))

const seedIfAbsent = asyncHandler(async (name, details) => {
    const [row] = await setting.findOrCreate({ where: { name }, defaults: { name, details } })
    return row
})

const save = asyncHandler(async (name, details) => {
    const [row, created] = await setting.findOrCreate({ where: { name }, defaults: { name, details } })
    if (!created) await row.update({ details })
    return row
})

module.exports = { findByName, seedIfAbsent, save }
