const express = require('express')
const router = express.Router({ mergeParams: true })
const { findOneCorporateUser, updateCorporateUser, updateMfaSetting,
  addBankDetails, totpGenerate, verifyTotp, deleteAccount,
  getEmailPhoneOTP, verifyEmailPhoneOTP, updateBankDetails,
  deleteBank, addAddress, findAllAddress, deleteAddress,
  updateAddressDetails, getOtpNew, verifyEmailPhoneOTPNew, getOtpBankAccount, userDetails,
  fetchProfileProgress,
  updatePanAndGstVerification, referThroughEmail,
  addressOTP
} = require("../../../../controllers/admin/corporateUser")
const { changePassword } = require("../../../../controllers/admin/credential")
const { findAllBankAccount } = require('../../../../controllers/corporate/invoices')
const {

  validateReferThroughEmail,
} = require("../../../../utils/apiValidation/referral");
const { validateBankAccount } = require('../../../../utils/apiValidation')
const { findAllUploadedOneKYBDocs, uploadOneKYBDocument } = require('../../../../controllers/corporate/corporateDocuments')
const { validateOneKYBDocsUpload } = require('../../../../utils/apiValidation/corporateDocuments')
const { validateProfileProgressQuery, validateOtpQuery, validateAddressQuery, validateAddressOtpQuery, validateProfileOtpQuery, validateBankOtpQuery, validateCorporateProfileParams } = require('../../../../utils/queryValidation')

router.get("/one-kyb", findAllUploadedOneKYBDocs);
router.get("/progress", validateProfileProgressQuery, fetchProfileProgress);
router.get("/profileDetails/:type",findOneCorporateUser);
router.patch("/changePassword", changePassword)//✅
router.put("/mfaSetting", updateMfaSetting)
router.post("/deleteAccount", deleteAccount)
router.get('/bank', findAllBankAccount)//✅
router.post("/bank",validateBankAccount, addBankDetails)//✅
router.put("/bank", updateBankDetails)//✅
router.delete('/bank/:id', deleteBank)//✅
router.get("/totp_generate", totpGenerate)
router.post('/verifyTotp', verifyTotp)
router.get("/get-otp", validateOtpQuery, getEmailPhoneOTP);
router.post("/verify-otp", verifyEmailPhoneOTP)
router.post("/address", addAddress);//✅
router.get("/addressDetails",validateAddressQuery, findAllAddress)//✅
router.delete("/address/:id", deleteAddress)//✅
router.get("/address-otp",validateAddressOtpQuery,addressOTP)
router.put("/address", updateAddressDetails);//✅
router.get("/get-otp-update", validateProfileOtpQuery, getOtpNew);
router.post('/verify-otp-both', verifyEmailPhoneOTPNew)
router.get('/otp-bank-details',validateBankOtpQuery, getOtpBankAccount)//✅
router.get("/walletDetails", userDetails)//✅
router.get('/:type',validateCorporateProfileParams, findOneCorporateUser)
router.patch("/", updateCorporateUser);//✅
router.patch("/refer", validateReferThroughEmail, referThroughEmail);
router.patch("/pan-gst-verification", updatePanAndGstVerification);

//ONE-KYB
router.post("/one-kyb", validateOneKYBDocsUpload, uploadOneKYBDocument);


module.exports = router