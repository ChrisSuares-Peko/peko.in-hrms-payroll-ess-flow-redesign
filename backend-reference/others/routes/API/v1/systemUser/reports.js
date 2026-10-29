const express = require('express');
const { findAllVendorTransactionsAndCount, findAllWorkspaceOrdersAndCount, findAllSubscriptionsOrdersAndCount, findAllTransactionsAndCountCorporateSide, vendorGeneratePDF, vendorGenerateExcelCSV, corporateGeneratePDF, corporateGenerateExcelCSV, workspaceOrdersGeneratePDF, workspaceOrdersGenerateExcelCSV, subscriptionOrdersGeneratePDF, subscriptionOrdersGenerateExcelCSV } = require('../../../../controllers/corporate/transactionReport');
const { findAllConnectionsAndCount, connectionGeneratePDF, connectionGenerateExcelCSV } = require('../../../../controllers/admin/peko_connect');
const { findAllInvoiceAndCount } = require('../../../../controllers/admin/invoices');
const { sendAMail,workspaceStatusUpdate } = require('../../../../controllers/admin/workspaces');
const { validateMailWorkspace, validateUpdateWorkSpaceStatus } = require('../../../../utils/apiValidation');
const { findAllPaymentLinksOrdersAndCount, paymentLinksOrdersGeneratePDF, paymentLinksOrdersGenerateExcelCSV } = require('../../../../controllers/admin/paymentLinks');
const { findAllDomainHostingRefundsAndCount, domainHostingRefundsGeneratePDF, domainHostingRefundsGenerateExcelCSV } = require('../../../../controllers/admin/domainHostingRefunds');


const router = express.Router({mergeParams:true})

router.get('/vendor-reports', findAllVendorTransactionsAndCount);//✅
router.get('/vendor-reports/pdf', vendorGeneratePDF)//✅
router.get('/vendor-reports/:type', vendorGenerateExcelCSV)//✅

router.get('/corporate-reports',findAllTransactionsAndCountCorporateSide)//✅
router.get('/corporate-reports/pdf', corporateGeneratePDF)//✅
router.get('/corporate-reports/:type', corporateGenerateExcelCSV)//✅

router.get('/connection-requests',findAllConnectionsAndCount)//✅
router.get('/connection-requests/pdf', connectionGeneratePDF)//✅
router.get('/connection-requests/:type', connectionGenerateExcelCSV)//✅

router.get('/invoice-reports',findAllInvoiceAndCount);

//WORKSPACE
router.get('/workspace-orders', findAllWorkspaceOrdersAndCount)//✅
router.get('/workspace-orders/pdf', workspaceOrdersGeneratePDF)//✅
router.get('/workspace-orders/:type', workspaceOrdersGenerateExcelCSV)//✅
router.post('/workspace-orders/send-email',validateMailWorkspace,sendAMail)
router.put('/workspace-orders/updateStatus/:id',validateUpdateWorkSpaceStatus, workspaceStatusUpdate)


//SUBSCRIPTION ORDERS
router.get('/subscription-orders',findAllSubscriptionsOrdersAndCount)//✅
router.get('/subscription-orders/pdf', subscriptionOrdersGeneratePDF)//✅
router.get('/subscription-orders/:type', subscriptionOrdersGenerateExcelCSV)//✅

//PAYMENT LINK ORDERS
router.get('/payment-links-orders',findAllPaymentLinksOrdersAndCount)
router.get('/payment-links/pdf',paymentLinksOrdersGeneratePDF)
router.get('/payment-links/:type',paymentLinksOrdersGenerateExcelCSV)

// DOMAIN & HOSTING REFUNDS
router.get('/domain-hosting-refunds', findAllDomainHostingRefundsAndCount)
router.get('/domain-hosting-refunds/pdf', domainHostingRefundsGeneratePDF)
router.get('/domain-hosting-refunds/:type', domainHostingRefundsGenerateExcelCSV)

module.exports = router