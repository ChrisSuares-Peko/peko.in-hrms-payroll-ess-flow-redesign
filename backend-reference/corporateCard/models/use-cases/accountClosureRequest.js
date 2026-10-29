const { Op } = require('sequelize')
const asyncHandler = require('../../middlewares/async')
const accountClosureRequest = require('../entities/accountClosureRequest')
const { CLOSURE_STATUS, OPEN_STATUSES } = require('../../constants/accountClosure')

const findLatestByCorporate = asyncHandler(async (corporateId) =>
    accountClosureRequest.findOne({
        where: { corporateId },
        order: [['id', 'DESC']],
    }))

const findOpenByCorporate = asyncHandler(async (corporateId) =>
    accountClosureRequest.findOne({
        where: { corporateId, status: { [Op.in]: OPEN_STATUSES } },
        order: [['id', 'DESC']],
    }))

const createRequest = asyncHandler(async (fields) => accountClosureRequest.create(fields))

const findAndCount = asyncHandler(async ({ status, limit, offset }) =>
    accountClosureRequest.findAndCountAll({
        where: { ...(status ? { status } : {}) },
        order: [['id', 'DESC']],
        limit,
        offset,
    }))

const findById = asyncHandler(async (id) => accountClosureRequest.findOne({ where: { id } }))

const updateById = asyncHandler(async (id, fields) =>
    accountClosureRequest.update(fields, { where: { id } }))

const decideFromPendingCAS = asyncHandler(async (id, fields) => {
    const [count] = await accountClosureRequest.update(
        fields,
        { where: { id, status: CLOSURE_STATUS.PENDING } }
    )
    return count
})

module.exports = {
    findLatestByCorporate,
    findOpenByCorporate,
    createRequest,
    findAndCount,
    findById,
    updateById,
    decideFromPendingCAS,
}
