const { verifyToken } = require('../../../../utils/jwtToken');
const express = require('express');
const router = express.Router({ mergeParams: true });

router.use(verifyToken)

//office and business
router.use("/edocs", require("./e-Docs"));
router.use("/pekoConnect", require("./peko_connect"))
router.use("/QRpayments", require("./QrPayments"))
router.use("/workspaces", require("./workspaces"))
router.use('/peko-cloud', require("./pekoCloud"))
router.use("/invoices", require("./invoices"))
router.use('/invoice-customer', require("./invoiceCustomer"))
router.use('/invoice-guideline', require("./invoiceGuideline"))
router.use('/invoice-templete', require("./invoiceTemplete"))
router.use("/carbonFootprint", require("./carbonFootprint"))
router.use('/ip-address', require("./ipAddress"))
router.use('/soundbox', require('./leadGenerator'))
router.use("/paytmBpos", require("./paytmBpos"));
router.use('/whatsapp-business', require("./whatsAppForBusiness"))
router.use('/works', require("./works"))
router.use('/e-sign', require("./eSign"))
router.use("/payment-links", require("./paymentLinks"))
router.use("/payrollDocs", require("./payrollDocs"));
router.use("/verification", require("./verificationSuite"))
router.use("/verification/v2", require("./verificationSuiteV2"))
router.use('/garage', require("./garage"))
router.use("/domain-and-hosting", require("./domainAndHosting"))
router.use("/service-cart", require("./serviceCart"))
router.use('/invoicing/v2', require("./invoicingV2"))
router.use('/invoice-customer/v2', require("./invoiceCustomerV2"))
router.use('/agreement', require("./agreement"))
router.use('/e-invoice', require("./eInvoice"))
router.use('/company-incorporation', require('./companyIncorporation'))
router.use('/compliance', require('./compliance'))
router.use('/tax', require("./taxAndMore"))
router.use('/global-business-setup', require('./globalBusinessSetup'))
router.use('/business-registration', require('./businessRegistration'))
router.use('/legalService', require('./legalService'))
router.use('/accounting', require('./accounting'))
router.use('/ecommerce', require('./ecommerceStore'))
router.use('/pos', require('./pos'))
router.use('/global-business-setup', require('./globalBusinessSetup'))
router.use('/email-templates', require('./emailTemplates'))
router.use('/ctrlpay', require('./ctrlPay'))

module.exports = router;
