const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router({ mergeParams: true });

const downloadRateLimiter = rateLimit({
    windowMs: 2 * 60 * 1000,
    max: 10,
    message: { status: false, message: 'Too many download requests. Please try again after 2 minutes.', responseCode: '429' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply rate limit only when ?type=download is passed
const conditionalDownloadRateLimit = (req, res, next) => {
    if (req.query.type === 'download') {
        return downloadRateLimiter(req, res, next);
    }
    next();
};

const receiptDownloadRateLimit = (req, res, next) => downloadRateLimiter(req, res, next);
const {
    createInvoice,
    findAllInvoicesAndCount,
    downloadInvoice,
    recordManualPayment,
    getInvoicePayments,
    getAllManualPayments,
    getAllReceipts,
    deleteInvoicePayment,
    updateCreditNoteStatus,
    downloadManualPaymentReceipt,
    sendManualPaymentReceiptEmail,
    updateReminderSettings,
    updateSalesOrderStatus,
    fetchAllCustomersForInvoice,
    editInvoice,
    deleteInvoice,
    getInvoiceById,
    getInvoiceDashboard,
    getSalesOrderDashboard,
    getQuotationDashboard,
    getPaymentsDashboardOverview,
    getPaymentsDashboardTopCustomers,
    getPaymentsDashboardDueThisWeek,
    getPaymentsDashboardRecentActivity,
    sendDocumentEmail,
    getSalesDashboard,
    getSalesRecentTransactions,
    getNextInvoiceNumber,
    getCreditNoteDashboard,
    getNextCreditNoteNumber,
    downloadCreditNote,
} = require('../../../../controllers/corporate/invoicingV2');
const {
    getSettings,
    saveSettings,
} = require('../../../../controllers/corporate/invoiceSettingsV2');
const {
    getHtmlTemplate,
} = require('../../../../controllers/corporate/invoiceTemplete');
const {
    getCatalog,
    addProduct,
    editProduct,
    deleteProduct,
} = require('../../../../controllers/corporate/invoiceCatalog');
const {
    getReminderRules,
    updateReminderRule,
    toggleAutomaticReminders,
} = require('../../../../controllers/corporate/invoiceReminderRules');
const {
    create: createRecurring,
    getAll: getAllRecurring,
    getDetails: getRecurringDetails,
    updateStatus: updateRecurringStatus,
} = require('../../../../controllers/corporate/invoiceRecurring');
const {
    fetchAgingAnalysis,
} = require('../../../../controllers/corporate/agingAnalysis');

const {
    validateInvoiceCreateV2,
    validateReminderSettings,
    validateUpdateInvoiceStatus,
    validateInvoiceSettings,
    validateGetAllInvoices,
    validateManualPayment,
    validateUpdateCreditNoteStatus,
    validateUpdateReminderRule,
    validateToggleAutomaticReminders,
    validateCatalogProduct,
} = require('../../../../utils/apiValidation');

// Dashboard
router.get('/sales/dashboard', getSalesDashboard);
router.get('/sales/recent-transactions', getSalesRecentTransactions);
router.get('/dashboard', getInvoiceDashboard);
router.get('/sales-order/dashboard', getSalesOrderDashboard);
router.get('/quotation/dashboard', getQuotationDashboard);
router.get('/payments/dashboard', getPaymentsDashboardOverview);
router.get('/payments/dashboard/top-customers', getPaymentsDashboardTopCustomers);
router.get('/payments/dashboard/due-this-week', getPaymentsDashboardDueThisWeek);
router.get('/payments/dashboard/recent-activity', getPaymentsDashboardRecentActivity);

// Next invoice number
router.get('/next-number', getNextInvoiceNumber);

// Invoice settings
router.get('/settings', getSettings);
router.post('/settings', validateInvoiceSettings, saveSettings);

// Invoice HTML templates (for PDF template picker)
router.get('/invoice-templates', getHtmlTemplate);

// Catalog
router.get('/catalog', getCatalog);
router.post('/catalog', validateCatalogProduct, addProduct);
router.put('/catalog/:id', validateCatalogProduct, editProduct);
router.delete('/catalog/:id', deleteProduct);

// Reminder rules
router.get('/reminder-rules', getReminderRules);
router.put('/reminder-rules/automatic', validateToggleAutomaticReminders, toggleAutomaticReminders);
router.put('/reminder-rules/:id', validateUpdateReminderRule, updateReminderRule);


// Aging Analysis
router.get('/agingAnalysis', fetchAgingAnalysis);

// Recurring Invoices
router.post('/recurring', createRecurring);
router.get('/recurring', getAllRecurring);
router.get('/recurring/:id', getRecurringDetails);
router.patch('/recurring/:id/status', updateRecurringStatus);

// Credit Notes
router.get('/credit-notes/dashboard', getCreditNoteDashboard);
router.get('/credit-notes/next-number', getNextCreditNoteNumber);
router.post('/credit-notes', validateInvoiceCreateV2, createInvoice);
router.get('/credit-notes/download/:invoiceId', conditionalDownloadRateLimit, downloadCreditNote);

router.get('/customers', fetchAllCustomersForInvoice);
router.get('/manual-payments', getAllManualPayments);
router.get('/receipts', getAllReceipts);
router.post('/', validateInvoiceCreateV2, createInvoice);
router.get('/all', validateGetAllInvoices, findAllInvoicesAndCount);
router.get('/downloadInvoice/:invoiceId', conditionalDownloadRateLimit, downloadInvoice);
router.get('/:invoiceId', getInvoiceById);
router.put('/:invoiceId', validateInvoiceCreateV2, editInvoice);
router.delete('/:invoiceId', deleteInvoice);
router.get('/:invoiceId/manual-payment', getInvoicePayments);
router.post('/:invoiceId/manual-payment', validateManualPayment, recordManualPayment);
router.delete('/:invoiceId/manual-payment/:paymentId', deleteInvoicePayment);
router.patch('/:invoiceId/credit-note-status', validateUpdateCreditNoteStatus, updateCreditNoteStatus);
router.post('/:invoiceId/manual-payment/:paymentId/receipt/download', receiptDownloadRateLimit, downloadManualPaymentReceipt);
router.post('/:invoiceId/manual-payment/:paymentId/receipt/email', sendManualPaymentReceiptEmail);
router.post('/:invoiceId/send-email', sendDocumentEmail);
router.patch('/:invoiceId/status', validateUpdateInvoiceStatus, updateSalesOrderStatus);
router.patch('/:invoiceId/reminder-settings', validateReminderSettings, updateReminderSettings);

module.exports = router;
