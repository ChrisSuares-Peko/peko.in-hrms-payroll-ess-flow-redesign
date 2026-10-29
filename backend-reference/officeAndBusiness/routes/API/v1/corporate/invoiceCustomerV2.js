const express = require('express');
const router = express.Router({ mergeParams: true });
const upload = require('../../../../middlewares/multer');
const { createCustomerV2, updateCustomerV2, deleteCustomerV2, getAllCustomersV2, getCustomerDashboard, verifyBankAccountDirect, getCustomerBulkExcelTemplate, sendCustomerBulkValidationResponse, bulkCreateCustomers } = require('../../../../controllers/corporate/invoiceCustomerV2');
const { validateCreateCustomerV2, validateGetAllCustomers, validateDirectBankVerification } = require('../../../../utils/apiValidation');
const { excelToJson, validateExcelData } = require('../../../../services/customerBulkUpload');

router.get('/dashboard', getCustomerDashboard);
router.post('/verify-bank', validateDirectBankVerification, verifyBankAccountDirect);

// Bulk upload — kept above '/:id' but doesn't collide since these are all static segments.
router.post('/bulk-excel-upload', upload.single('file'), excelToJson, validateExcelData, sendCustomerBulkValidationResponse);
router.get('/bulk-excel-template', getCustomerBulkExcelTemplate);
router.post('/bulk-validate', validateExcelData, sendCustomerBulkValidationResponse);
router.post('/bulk-create', validateExcelData, bulkCreateCustomers);

router.get('/', validateGetAllCustomers, getAllCustomersV2);
router.post('/', validateCreateCustomerV2, createCustomerV2);
// Reusing validateCreateCustomerV2 for update since both require the same fields
router.put('/:id', validateCreateCustomerV2, updateCustomerV2);
router.delete('/:id', deleteCustomerV2);

module.exports = router;
