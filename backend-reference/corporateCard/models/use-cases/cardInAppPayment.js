const { Op } = require('sequelize')
const cardInAppPayment = require('../entities/cardInAppPayment')
const asyncHandler = require('../../middlewares/async')
const { IN_APP_STATUS } = require('../../constants/inAppPayment')

const findByPaymentRefId = asyncHandler(async (paymentRefId) =>
    cardInAppPayment.findOne({ where: { paymentRefId } }))

const findById = asyncHandler(async (id) => cardInAppPayment.findOne({ where: { id } }))

const findByInvoiceNumber = asyncHandler(async (invoiceNumber) =>
    cardInAppPayment.findOne({ where: { invoiceNumber }, order: [['id', 'DESC']] }))

// Idempotent on paymentRefId: a redelivered call gets the existing row back without wasCreated, so the
// caller reports that row's state instead of redeeming a second time.
const createInitiated = asyncHandler(async (fields) => {
    try {
        const row = await cardInAppPayment.create(fields)
        row.wasCreated = true
        return row
    } catch (err) {
        if (err?.name === 'SequelizeUniqueConstraintError') return findByPaymentRefId(fields.paymentRefId)
        throw err
    }
})

const updateById = asyncHandler(async (id, fields) => {
    await cardInAppPayment.update(fields, { where: { id } })
    return findById(id)
})

// Rows whose redeem never closed: INITIATED past the vendor budget, or TIMEOUT whose in-process reverse was lost.
const findStale = asyncHandler(async ({ initiatedBefore, timeoutBefore, limit = 50 }) =>
    cardInAppPayment.findAll({
        where: {
            [Op.or]: [
                { status: IN_APP_STATUS.INITIATED, createdAt: { [Op.lt]: initiatedBefore } },
                { status: IN_APP_STATUS.TIMEOUT, updatedAt: { [Op.lt]: timeoutBefore } },
            ],
        },
        order: [['id', 'ASC']],
        limit,
    }))

module.exports = { findByPaymentRefId, findById, findByInvoiceNumber, findStale, createInitiated, updateById }
