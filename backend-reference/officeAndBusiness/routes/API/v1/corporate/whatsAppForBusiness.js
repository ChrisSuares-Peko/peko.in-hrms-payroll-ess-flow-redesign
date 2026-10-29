const express = require('express')
const router = express.Router()

const { fetchAllplanFamilies, createBusinessProfile, stopProjectBilling,
    reactivateProjectBilling, fetchAllProjects, createProject, payment,
    fetchOrders, stopWhatsAppBilling,
    generateEmbeddedSignupURL,
    checkProjectExist,
    ssoLogin,
    fetchPlanDetails,
    getPurchaseHistory,
    getActiveSubscription,
    getLastWhatsAppSubscription,
    stopBotBuilder,
    getBotBuilderAmount,
    getActiveBotBuilder,
    stopShopifyIntegration,
    getShopifyIntegrationAmount,
    getActiveShopifyIntegration,
    findTransactionDetails } = require('../../../../controllers/corporate/whatsAppForBusiness')
const operatorsData = require('../../../../utils/operatorsData.json')

const { verifyUser } = require('../../../../middlewares/verifySubCorporate');
const { validateOrdersQuery, validatePurchaseHistoryQuery } = require('../../../../utils/apiValidations/queryValidation');
const { checkServiceEnabled } = require('../../../../middlewares/disableServiceCheck');
let accessKey = operatorsData["whatsAppForBusiness"]["accessKey"];

router.use(verifyUser('WhatsApp for Business'));
router.use(checkServiceEnabled(accessKey));

//# 0. subscription - common api

//# 1. Business profile
router.post('/businessProfile', createBusinessProfile)

//# 2. Project view
router.get('/projects', fetchAllProjects)

//# 3. Create Project 
router.post('/createProjects', createProject)

//# 4. Buy credit
router.post('/payment', payment)

//# 5. Show history
router.get('/orders-history',validateOrdersQuery, fetchOrders)

//# 6. manage billing
router.patch('/stopPlanBilling', stopProjectBilling)
router.patch('/reactivateProjectBilling', reactivateProjectBilling)

//# 7. complete stopping 
router.patch('/stopWhatsAppBilling', stopWhatsAppBilling)

//# 8. generate Embedded Signup URL
router.post('/generateEmbeddedSignupURL', generateEmbeddedSignupURL)

//# 9. checking the project name already exist or not
router.post('/checkProjectExist', checkProjectExist)

//---Not using---//
//Plan family
router.get('/planFamilies', fetchAllplanFamilies)

router.get('/ssoLogin', ssoLogin)

//fetching plan details
router.get("/plans", fetchPlanDetails)

// subscription history
router.get('/purchse-history',validatePurchaseHistoryQuery, getPurchaseHistory);

// active subscription
router.get('/activeSubscription', getActiveSubscription);

// active bot builder
router.get('/activeBotBuilder', getActiveBotBuilder);

// active bot builder
router.get('/getBotBuilderAmount', getBotBuilderAmount);

// Cancel bot builder
router.patch('/stopBotBuilder', stopBotBuilder);

// active shopify integration
router.get('/activeShopifyIntegration', getActiveShopifyIntegration);

// shopify integration amount
router.get('/getShopifyIntegrationAmount', getShopifyIntegrationAmount);

// Cancel shopify integration
router.patch('/stopShopifyIntegration', stopShopifyIntegration);

// Invoice download
router.get('/download-invoice/:subscriptionId', findTransactionDetails);

// fetching last subscription
router.get('/last-whatsapp-subscription', getLastWhatsAppSubscription);

module.exports = router