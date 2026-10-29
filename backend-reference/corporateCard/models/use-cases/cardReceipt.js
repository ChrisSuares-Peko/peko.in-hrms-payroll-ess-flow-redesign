const cardReceipt = require('../entities/cardReceipt')
const asyncHandler = require('../../middlewares/async')

const RECEIPT_STATUS = { ACTIVE: 'ACTIVE', DELETED: 'DELETED' }

const createReceipt = asyncHandler(async (fields) => cardReceipt.create({ status: RECEIPT_STATUS.ACTIVE, ...fields }))

const listActiveReceiptsByTransaction = asyncHandler(async (cardTransactionId) =>
    cardReceipt.findAll({
        where: { cardTransactionId, status: RECEIPT_STATUS.ACTIVE },
        order: [['id', 'DESC']],
    }))

const findActiveReceiptById = asyncHandler(async (id, cardTransactionId) =>
    cardReceipt.findOne({ where: { id, cardTransactionId, status: RECEIPT_STATUS.ACTIVE } }))

const softDeleteReceipt = asyncHandler(async (receipt) => receipt.update({ status: RECEIPT_STATUS.DELETED }))

module.exports = { RECEIPT_STATUS, createReceipt, listActiveReceiptsByTransaction, findActiveReceiptById, softDeleteReceipt }
