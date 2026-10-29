const express = require('express');
const multer = require('multer');
const { uploadStagedDocument } = require('../../../../middlewares/visaDocumentUpload');

const router = express.Router({ mergeParams: true });
const { checkServiceEnabled } = require('../../../../middlewares/disableServiceCheck');
const operatorsData = require('../../../../utils/operatorsData.json');
const {
    getCountries,
    getDestinations,
    getCountryFlags,
    getNationalityAndResidency,
    findAllAddress,
    searchVisaOptions,
    getProductDocuments,
    getProductContent,
    createOrder,
    stageDocument,
    getApplicantDocuments,
    uploadDocument,
    getApplicationStatus,
    getOrderStatus,
    getOrderDetails,
    listApplications,
    listBookings,
    processWalletPayment,
} = require('../../../../controllers/corporate/visa');

const { validateAddressQuery } = require('../../../../utils/apiValidation/queryValidation');

const {
    validateVisaSearch,
    validateProductDocuments,
    validateProductContent,
    validateCreateOrder,
    validateStageDocument,
    validateApplicantDocuments,
    validateUploadDocument,
    validateApplicationStatus,
    validateOrderDetails,
    validateListApplications,
    validateListBookings,
    validateWalletPayment,
} = require('../../../../utils/apiValidation/visa');

const accessKey = operatorsData.visa.accessKey;
const upload = multer({ storage: multer.memoryStorage() });

router.use(checkServiceEnabled(accessKey));

// Countries & search
router.get('/countries', getCountries);
router.get('/destinations', getDestinations);
router.get('/countries-flags', getCountryFlags);
router.get('/nationality-residency', getNationalityAndResidency);
router.get('/addressDetails', validateAddressQuery, findAllAddress);
router.get('/search', validateVisaSearch, searchVisaOptions);

// Product info
router.get('/product-documents', validateProductDocuments, getProductDocuments);
router.get('/product-content', validateProductContent, getProductContent);

// Order lifecycle
router.post('/order/create', validateCreateOrder, createOrder);
router.post('/order/stage-document', uploadStagedDocument, validateStageDocument, stageDocument);
router.get('/order/applicant-documents', validateApplicantDocuments, getApplicantDocuments);
router.post('/order/upload-document', upload.single('file'), validateUploadDocument, uploadDocument);
router.get('/order/application-status', validateApplicationStatus, getApplicationStatus);
router.get('/order/status', validateOrderDetails, getOrderDetails);
router.get('/order/status/:orderNumber', getOrderStatus);
router.get('/order/details', validateOrderDetails, getOrderDetails);

// User's application list
router.get('/applications', validateListApplications, listApplications);

// Manage bookings
router.get('/bookings', validateListBookings, listBookings);

// Wallet payment (called by payment-gateway service)
router.post('/payment/wallet', validateWalletPayment, processWalletPayment);

module.exports = router;
