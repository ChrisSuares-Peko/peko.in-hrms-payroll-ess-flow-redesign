const express = require('express')
const router = express.Router()
const {
    searchDomains,
    registerCustomer,
    loginCustomer,
    generateSsoLogin,
    getHostingServices,
    getHostingPlansByType,
    payment,
    getOrderHistory,
    downloadOrderInvoice,
    deletePlan,
} = require('../../../../controllers/corporate/domainAndHosting');
const { validateDomainHostingPayment } = require('../../../../utils/apiValidation');
const validateDomainHostingWalletAmount = require('../../../../middlewares/domainHostingPaymentValidation');

router.get('/services', getHostingServices)
router.get('/services/plans', getHostingPlansByType)
router.post('/search', searchDomains)
router.post('/validate-cart', validateDomainHostingWalletAmount, (_req, res) => res.status(200).json({ status: true, message: 'Cart validated' }))
router.post('/payment', validateDomainHostingPayment, validateDomainHostingWalletAmount, payment)
router.post('/customer/register', registerCustomer)
router.post('/customer/details', loginCustomer)
router.post('/customer/sso-login', generateSsoLogin)
router.get('/orders', getOrderHistory)
router.get('/orders/:corporateTxnId/invoice', downloadOrderInvoice)
router.post('/plan/delete', deletePlan)

module.exports = router
