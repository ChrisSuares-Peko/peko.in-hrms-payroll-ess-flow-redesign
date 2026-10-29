const express = require('express');
const router = express.Router({ mergeParams: true });

const SERVICES = require('../../../../utils/operatorsData.json');
const { checkServiceEnabled } = require('../../../../middlewares/disableServiceCheck');
const upload = require('../../../../middlewares/multer.js');

const {
  verifyBankAccountV2,
  verifyPanV2,
  verifyGstinV2,
  verifyGstinByPanV2,
  generateAadhaarLinkV2,
  getAadhaarDetailsV2,
  getVerificationHistoryV2,
  getVerificationCountV2,
  getVerificationAddOnDetailsV2,
  getVerificationAddOnHistoryV2,
  verifyGSTINBusiness,
  gstReturnComplainceCheck,
  fetchDirectorDetailsCIN,
  fetchDirectorDetailsDIN,
  corporateEntitiyVerification,
  verificationGeneratePDFV2,
  verificationGenerateExcelCSVV2
} = require('../../../../controllers/corporate/verificationSuiteV2');

const {
  validateBankAccountDetails,
  validatePANDetailsV2,
  validateGSTINBodyV2,
  validateGstinByPanV2,
  validateGenerateAadhaarLinkV2,
} = require('../../../../utils/apiValidation.js');
const { validateVerificationQueryV2, validateExportType, validateVerificationAddonHistoryQuery } = require('../../../../utils/apiValidations/queryValidation.js');
const { getVerificationPrice } = require('../../../../controllers/corporate/verificationSuite.js');

router.post('/bank-account', checkServiceEnabled(SERVICES.bankAccount.accessKey), upload.none(), validateBankAccountDetails, verifyBankAccountV2)
router.post('/pan', checkServiceEnabled(SERVICES.pan.accessKey), upload.none(), validatePANDetailsV2, verifyPanV2)
router.post('/gst-verify', checkServiceEnabled(SERVICES.gstinBusiness.accessKey), upload.none(), validateGSTINBodyV2, verifyGstinV2)
router.post('/gst-by-pan', checkServiceEnabled(SERVICES.panGstin.accessKey), upload.none(), validateGstinByPanV2, verifyGstinByPanV2)
router.post('/aadhaar/generate-link', checkServiceEnabled(SERVICES.aadharVerify.accessKey), upload.none(), validateGenerateAadhaarLinkV2, generateAadhaarLinkV2)
router.post('/aadhaar/details', checkServiceEnabled(SERVICES.aadharVerify.accessKey), upload.none(), getAadhaarDetailsV2)

router.get('/gst-business', checkServiceEnabled(SERVICES.gstinBusiness.accessKey), verifyGSTINBusiness);
router.get('/gst/return', checkServiceEnabled(SERVICES.gstinComplianceCheck.accessKey), gstReturnComplainceCheck);
router.post('/director/cin', checkServiceEnabled(SERVICES.directorCIN.accessKey), fetchDirectorDetailsCIN);
router.post('/director/din', checkServiceEnabled(SERVICES.directorDIN.accessKey), fetchDirectorDetailsDIN);
router.post('/corporate', checkServiceEnabled(SERVICES.corporateVerify.accessKey), corporateEntitiyVerification);

router.get('/verification-history', validateVerificationQueryV2, getVerificationHistoryV2)
router.get('/verification-history/pdf', validateVerificationQueryV2, verificationGeneratePDFV2)
router.get('/verification-history/:type', validateVerificationQueryV2, validateExportType, verificationGenerateExcelCSVV2)
router.get('/get-price', getVerificationPrice)
router.get('/count', getVerificationCountV2)
router.get('/add-ons', getVerificationAddOnDetailsV2)
router.get('/add-on-history', validateVerificationAddonHistoryQuery, getVerificationAddOnHistoryV2)

module.exports = router
