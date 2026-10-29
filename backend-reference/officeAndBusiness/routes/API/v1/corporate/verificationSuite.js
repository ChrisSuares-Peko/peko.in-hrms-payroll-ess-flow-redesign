const express = require('express');
const router = express.Router({ mergeParams: true });

const SERVICES = require('../../../../utils/operatorsData.json');
const { checkServiceEnabled } = require('../../../../middlewares/disableServiceCheck');

const {
  verifyBankAccount,
  verifyIfscCode,
  verifyPan,
  advancePanVerification,
  verifyDrivingLicense,
  verifyVoterId,
  verifyAadhaarOtp,
  verifyAadhaar,
  verifyAadhaarPhoto,
  verifyPassport,
  verifyCIN,
  verifyGSTIN,
  fetchPanGstinDetails,
  verifyGSTINBusiness,
  gstReturnComplainceCheck,
  corporateEntitiyVerification,
  fetchDirectorDetailsCIN,
  fetchDirectorDetailsDIN,
  findAllRecordsOrderListAndCount,
  getVerificationPrice,
  verificationGeneratePDF,
  verificationGenerateExcelCSV
} = require('../../../../controllers/corporate/verificationSuite');

const {
  validateBankAccountDetails,
  validateIFSC,
  validatePANAndName,
  validateDLAndDOB,
  validateVoterIdDetails,
  validateAadhaarNumber,
  validateOtpVerification,
  validatePassportDetails,
  validateCINDetails,
  validateGSTINDetails,
  validatePANDetails
} = require('../../../../utils/apiValidation.js');
const { validateVerificationQuery } = require('../../../../utils/apiValidations/queryValidation.js');

const upload = require('../../../../middlewares/multer.js');

router.post('/bank-account', checkServiceEnabled(SERVICES.bankAccount.accessKey), validateBankAccountDetails, verifyBankAccount)
router.post('/ifsc', checkServiceEnabled(SERVICES.ifsc.accessKey), validateIFSC, verifyIfscCode)
router.post('/pan', checkServiceEnabled(SERVICES.pan.accessKey), validatePANAndName, verifyPan)
router.post('/advance/pan', checkServiceEnabled(SERVICES.advancePAN.accessKey), validatePANAndName, advancePanVerification)
router.post('/driving-license', checkServiceEnabled(SERVICES.drivingLicense.accessKey), validateDLAndDOB, verifyDrivingLicense)
router.post('/voter-id', checkServiceEnabled(SERVICES.voterId.accessKey), validateVoterIdDetails, verifyVoterId)
router.post('/aadhar/otp', checkServiceEnabled(SERVICES.aadharVerify.accessKey), validateAadhaarNumber, verifyAadhaarOtp)
router.post('/aadhar/verify', checkServiceEnabled(SERVICES.aadharVerify.accessKey), validateOtpVerification, verifyAadhaar)
router.post('/aadhar-masking', checkServiceEnabled(SERVICES.aadhaarOCR.accessKey), upload.single("image"), verifyAadhaarPhoto)
router.post('/passport', checkServiceEnabled(SERVICES.passport.accessKey), validatePassportDetails, verifyPassport)
router.post('/cin', checkServiceEnabled(SERVICES.cin.accessKey), validateCINDetails, verifyCIN)
router.post('/gstin', checkServiceEnabled(SERVICES.gstin.accessKey), validateGSTINDetails, verifyGSTIN)
router.post('/pan-gstin', checkServiceEnabled(SERVICES.panGstin.accessKey), validatePANDetails, fetchPanGstinDetails)

router.get('/gst-verify', checkServiceEnabled(SERVICES.gstinBusiness.accessKey), verifyGSTINBusiness);
router.get('/gst/return', checkServiceEnabled(SERVICES.gstinComplianceCheck.accessKey), gstReturnComplainceCheck);
router.post('/corporate', checkServiceEnabled(SERVICES.corporateVerify.accessKey), corporateEntitiyVerification);
router.post('/director/cin', checkServiceEnabled(SERVICES.directorCIN.accessKey), fetchDirectorDetailsCIN);
router.post('/director/din', checkServiceEnabled(SERVICES.directorDIN.accessKey), fetchDirectorDetailsDIN);

router.get('/verification-history', validateVerificationQuery, findAllRecordsOrderListAndCount)
router.get('/get-price', getVerificationPrice)

router.get('/verification-history/pdf', validateVerificationQuery, verificationGeneratePDF)
router.get('/verification-history/:type', validateVerificationQuery, verificationGenerateExcelCSV)

module.exports = router