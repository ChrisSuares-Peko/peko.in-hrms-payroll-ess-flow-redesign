const router = require('express').Router({ mergeParams: true })
const { verifyCorporateAdmin } = require('../../../../middlewares/verifyCorporateAdmin')
const {
    listTransactions,
    getTransactionsSummary,
    getTransaction,
    exportTransactions,
    decideTransactionApproval,
} = require('../../../../controllers/corporate/cardTransactions')
const {
    uploadReceipt,
    listReceipts,
    deleteReceipt,
} = require('../../../../controllers/corporate/cardReceipts')
const {
    addComment,
    listComments,
} = require('../../../../controllers/corporate/cardComments')

router.get('/', listTransactions)
router.get('/summary', getTransactionsSummary)
router.get('/export', exportTransactions)
router.get('/:id', getTransaction)

router.post('/:id/receipts', uploadReceipt)
router.get('/:id/receipts', listReceipts)
router.delete('/:id/receipts/:receiptId', deleteReceipt)

router.post('/:id/comments', addComment)
router.get('/:id/comments', listComments)

router.post('/:id/approval', verifyCorporateAdmin, decideTransactionApproval)

module.exports = router
