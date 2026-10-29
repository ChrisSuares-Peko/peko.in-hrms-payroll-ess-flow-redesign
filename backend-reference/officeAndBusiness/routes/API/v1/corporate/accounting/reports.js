const express = require('express');

const router = express.Router({ mergeParams: true });

const {
    getReportSummary,
    getReportInsights,
    getAccountsReceivable,
    getBusinessHealth,
    getProfitAndLoss,
    getBalanceSheet,
    getCashFlowStatement,
    getCashFlowOverview,
    getFreeCashFlow,
    getGstSummary,
    getAccountsPayable,
    getPlComparisonPdf,
    exportProfitAndLoss,
    exportGstSummary,
    exportAccountsReceivable,
    exportBalanceSheet,
    getBsComparisonPdf,
    getWorkingCapital,
} = require('../../../../../controllers/corporate/accountingReport');
const {
    validateReportSummary,
    validateReportInsights,
    validateProfitAndLoss,
    validateBalanceSheet,
    validateCashFlowStatement,
    validatePlComparison,
} = require('../../../../../utils/apiValidation');

router.get('/summary', validateReportSummary, getReportSummary);
router.get('/profit-and-loss', validateProfitAndLoss, getProfitAndLoss);
router.get('/profit-and-loss/export', validateProfitAndLoss, exportProfitAndLoss);
router.get('/compare', validatePlComparison, getPlComparisonPdf);
router.get('/balance-sheet', validateBalanceSheet, getBalanceSheet);
router.get('/balance-sheet/export', validateBalanceSheet, exportBalanceSheet);
router.get('/balance-sheet/compare', validatePlComparison, getBsComparisonPdf);
router.get('/cash-flow-statement', validateCashFlowStatement, getCashFlowStatement);
router.get('/cash-flow-overview', validateCashFlowStatement, getCashFlowOverview);
router.get('/free-cash-flow', validateCashFlowStatement, getFreeCashFlow);
router.get('/gst-summary', validateCashFlowStatement, getGstSummary);
router.get('/gst-summary/export', validateCashFlowStatement, exportGstSummary);
router.get('/accounts-payable', validateCashFlowStatement, getAccountsPayable);
router.get('/insights', validateReportInsights, getReportInsights);
router.get('/accounts-receivable', validateReportSummary, getAccountsReceivable);
router.get('/accounts-receivable/export/:format', validateReportSummary, exportAccountsReceivable);
router.get('/business-health', validateReportSummary, getBusinessHealth);
router.get('/working-capital', validateReportSummary, getWorkingCapital);

module.exports = router;
