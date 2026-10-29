const express = require('express')
const router = express.Router()
const {
    register,
    getOtp,
    validateEmailAndMobile,
    validateEmail,
    verifyOtp,
    verifyTaxId,
    confirmValidation,
    savePanGst
    } = require('../../../controllers/admin/signUp');
const { validateAddCorporate } = require('../../../utils/apiValidation');
const { checkPermission } = require('../../../utils/checkPermission');
const {
    validateRegister,
    validateOtpRequest,
    validateOTPRequest,
    validateEmailAndMobileInput,
} = require('../../../utils/apiValidation')
const { otpRateLimiter, otpVerifyRateLimiter, RateLimiter } = require('../../../middlewares/ratelimit')

// /signUp re-verifies the email/mobile OTP, so without a throttle it is an OTP brute-force endpoint.
const signUpRateLimiter = RateLimiter({
    keyBy: 'body_email',
    max: 10,
    windowMs: 10 * 60 * 1000,
    message: 'Too many attempts. Please request a new code and try again later.',
})
// Each verify-tax-id call is a paid vendor lookup; both routes are public during signup.
const taxIdRateLimiter = RateLimiter({
    keyBy: 'body_email',
    max: 20,
    windowMs: 60 * 60 * 1000,
    message: 'Too many verification attempts. Please try again later.',
})

router.post('/signUp', signUpRateLimiter, validateRegister, register);
router.post('/otp', ...otpRateLimiter('body_email', 429), validateOtpRequest, getOtp);
router.post('/verify-emailOtp', otpVerifyRateLimiter('body_email', 429), validateOTPRequest, verifyOtp);
router.post('/verify-tax-id', taxIdRateLimiter, verifyTaxId)
router.post('/saveDocs', taxIdRateLimiter, savePanGst)
router.post('/validate', validateEmailAndMobileInput, validateEmailAndMobile);
router.post('/validation-link', validateEmail);
router.post('/validate-email', confirmValidation)
router.post('/add-corporate', validateAddCorporate,checkPermission('Corporate Users','write'), register);



module.exports = router