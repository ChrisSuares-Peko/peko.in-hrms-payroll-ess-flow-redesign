const express = require('express');
const router = express.Router({ mergeParams: true });

const {
    getAllTransactions,
    exportTransactions,
    exportSelectedTransactions,
    getTransactionById,
    createTransaction,
    parseBankStatement,
    confirmBankStatement,
    discardBankStatement,
    updateTransaction,
    toggleRecurring,
    toggleHidden,
    updateNote,
    updateCategory,
    updateAccount,
    deleteTransaction,
    getLinkableInvoices,
    createTransactionLinks,
    deleteTransactionLink,
    uploadTransactionDocument,
    deleteTransactionDocument,
} = require('../../../../../controllers/corporate/accountingTransaction');
const {
    validateListAccountingTransactions,
    validateCreateAccountingTransaction,
    validateUpdateAccountingTransaction,
    validateUpdateTransactionNote,
    validateUpdateTransactionCategory,
    validateUpdateTransactionAccount,
    validateToggleTransactionRecurring,
    validateToggleTransactionHidden,
    validateCreateTransactionLinks,
    validateTransactionDocument,
    validateExportSelectedTransactions,
} = require('../../../../../utils/apiValidation');

// Static/sub-paths must precede the dynamic '/:id' routes.
router.get('/linkable/invoices', getLinkableInvoices);
// GET exports all rows matching the list filters; POST exports the selected rows by id.
router.get('/export/:format', validateListAccountingTransactions, exportTransactions);
router.post('/export/:format', validateExportSelectedTransactions, exportSelectedTransactions);

// Bank-statement import (Gemini extraction → review → confirm).
router.post('/import/parse', parseBankStatement);
router.post('/import/:batchId/confirm', confirmBankStatement);
router.delete('/import/:batchId', discardBankStatement);

router.get('/', validateListAccountingTransactions, getAllTransactions);
router.post('/', validateCreateAccountingTransaction, createTransaction);

router.post('/:id/links', validateCreateTransactionLinks, createTransactionLinks);
router.delete('/:id/links/:linkId', deleteTransactionLink);

router.post('/:id/documents', validateTransactionDocument, uploadTransactionDocument);
router.delete('/:id/documents/:docId', deleteTransactionDocument);

router.patch('/:id/recurring', validateToggleTransactionRecurring, toggleRecurring);
router.patch('/:id/hidden', validateToggleTransactionHidden, toggleHidden);
router.patch('/:id/note', validateUpdateTransactionNote, updateNote);
router.patch('/:id/category', validateUpdateTransactionCategory, updateCategory);
router.patch('/:id/account', validateUpdateTransactionAccount, updateAccount);

router.get('/:id', getTransactionById);
router.patch('/:id', validateUpdateAccountingTransaction, updateTransaction);
router.delete('/:id', deleteTransaction);

module.exports = router;
