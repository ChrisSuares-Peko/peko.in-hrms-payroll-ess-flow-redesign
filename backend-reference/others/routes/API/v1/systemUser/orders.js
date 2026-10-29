const express = require('express')
const router = express.Router()
const {
     getExcel,
     getOtp,
     refundAndUpdateOrder,
     findAllTransactionsAndCount,
     generateTransactionPDF,
     generateTransactionExcelCSV,
     getTransactionDiagnosticDetails
} = require('../../../../controllers/admin/order.js')
const { resendEmail } = require('../../../../controllers/admin/order.js')
const { validateTransactionsQuery } = require('../../../../utils/queryValidation.js')
const { requireAdminSystemUser } = require('../../../../utils/jwtToken')

router.get('/transactions',validateTransactionsQuery, findAllTransactionsAndCount)//✅
router.get('/transactions/pdf',validateTransactionsQuery, generateTransactionPDF)//✅
router.get('/transactions/:type',validateTransactionsQuery, generateTransactionExcelCSV)//✅
router.get('/transactions/:transactionId/details', getTransactionDiagnosticDetails);
router.get('/get-otp', getOtp)
// F-OTH-03: refunding money was callable by any system user, not just an admin — same
// admin gate as every other money-moving endpoint fixed this session.
router.put('/refund', requireAdminSystemUser, refundAndUpdateOrder)
router.get('/excel', getExcel)
router.post('/resend-email', resendEmail)

module.exports = router
