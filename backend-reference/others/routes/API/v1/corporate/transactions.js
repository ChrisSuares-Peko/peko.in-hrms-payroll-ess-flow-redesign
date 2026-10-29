const express = require('express')
const router = express.Router({ mergeParams: true })
const {
  transactionReports, findAllTransactionsAndCount, findTransactionDetails, findAllTransactionsAndCountCashback, corporateTransactionGeneratePDF, corporateTransactionGenerateExcelCSV,
  findAllSubscriptionOrdersCount,
  corporateSubscriptionTransactionGeneratePDF,
  corporateSubscriptionTransactionGenerateExcelCSV,
  findSubscriptionDetails,
  getSubscriptionTransactionStatus
} = require("../../../../controllers/corporate/transactionReport")
const { validateTransactionReportQuery, validateTransactionListQuery, validateCashbackQuery, validateTransactionIdParam, validateCorporateReportQuery, validateExportTypeParam, validateSubscriptionOrdersQuery } = require('../../../../utils/queryValidation')

router.get("/reports", validateTransactionReportQuery, transactionReports)
router.get("/orders", validateTransactionListQuery, findAllTransactionsAndCount)//✅
router.get("/cashback", validateCashbackQuery, findAllTransactionsAndCountCashback);
router.get('/download/:transactionId/:type?', validateTransactionIdParam, findTransactionDetails);
router.get("/orders/pdf", validateCorporateReportQuery, corporateTransactionGeneratePDF);
router.get("/orders/:type", validateExportTypeParam, validateCorporateReportQuery, corporateTransactionGenerateExcelCSV);

router.get("/subscriptionOrders", validateSubscriptionOrdersQuery, findAllSubscriptionOrdersCount);
router.get('/subscriptionOrders/pdf',validateSubscriptionOrdersQuery, corporateSubscriptionTransactionGeneratePDF)
router.get('/subscriptionOrders/:type',validateSubscriptionOrdersQuery, corporateSubscriptionTransactionGenerateExcelCSV)
router.get(  '/subscriptionOrdersDownload/:transactionId/:type?',  validateTransactionIdParam,  findSubscriptionDetails
);
router.get('/subscriptionStatus/:transactionId', validateTransactionIdParam, getSubscriptionTransactionStatus);

module.exports = router