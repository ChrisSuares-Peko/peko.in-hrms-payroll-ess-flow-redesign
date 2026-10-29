const express = require('express');
const router = express.Router({ mergeParams: true });
const operatorsData = require("../../../../utils/operatorsData.json");
const { verifyDocument, addDocumentToGarage, getFleetsAndCount, getDriversAndCount, createGarageAssignment, deleteGarageAssignment, getAFleet, updateFleetServiceDates, updateFleetFastag, createQuoteRequest, getADriver, deleteDriver, deleteFleet, getOperationLogs, dashboardDetails, refreshDashboard, createDocument, getAllUserDocuments, deleteDocuments, getDocumentDetails, getExcelDrivers, getExcelFleets, getGarageUsages, updateDocument, refreshFleet } = require('../../../../controllers/corporate/garage');
const { getCarReportCatalog } = require('../../../../controllers/corporate/carReportCatalog');
const { payment, fetchCarReportOrders, fetchCarReportOrderDetail, fetchCarReportPlans } = require('../../../../controllers/corporate/carReport');
const { requireSubscriptionAccess } = require('../../../../middlewares/requireSubscriptionAccess');
const { checkServiceEnabled } = require('../../../../middlewares/disableServiceCheck');
const { validateGarageDocument, validateFleetServiceDates, validateQuoteRequest, validateFleetFastag, validateGarageDocumentCreate, validateGarageDocumentUpdate } = require('../../../../utils/apiValidation');
// const { verifyUser } = require('../../../../middlewares/verifySubCorporate');
// router.use(verifyUser('eSign'));
const accesskey = operatorsData['garage']['accessKey']
// Car Reports is its own sellable service inside Turbo, so it carries its own access key
// for the per-credential disable check on top of the garage subscription gate below.
const carReportAccessKey = operatorsData['carReport']['accessKey']
router.use(requireSubscriptionAccess(accesskey));

router.get('/', dashboardDetails);
router.post('/verify/:type', validateGarageDocument, verifyDocument);
router.post('/add/:type', addDocumentToGarage);
router.get('/fleets', getFleetsAndCount);
router.get('/fleet/:id', getAFleet);
router.put('/fleet/:id', validateFleetServiceDates, updateFleetServiceDates);
router.put('/fleet/:id/fastag', validateFleetFastag, updateFleetFastag);
router.post('/fleet/:id/refresh', refreshFleet);
router.post('/quote-request', validateQuoteRequest, createQuoteRequest);
router.get('/fleets/:type', getExcelFleets);
router.delete('/fleet/:id', deleteFleet);
router.get('/drivers', getDriversAndCount);
router.get('/drivers/:type', getExcelDrivers)
router.get('/driver/:id', getADriver);
router.delete('/driver/:id', deleteDriver);
router.post('/assignment', createGarageAssignment);
router.delete('/assignment/:id', deleteGarageAssignment);
router.get('/logs', getOperationLogs);
router.get('/refresh', refreshDashboard);
router.get('/usage-count', getGarageUsages)

// Car Reports (Droom MYBIZ) — this service owns the whole feature: the lookups below and
// the purchase/order-history endpoints after them. The only piece elsewhere is the
// Cashfree post-payment leg, which has to sit in paymentGateway's callback switch.
// Droom MYBIZ catalog lookup (category -> make -> model -> year -> trim).
router.get('/car-report/catalog', getCarReportCatalog);
// Live prices + package availability (admin-managed carReportPlans).
router.get('/car-report/plans', fetchCarReportPlans);
// Purchase, and the resulting order record. A valuation's PDF is ordered from Droom
// inside the purchase (carReportPaas.js) — there is no pre-payment vendor lookup.
router.post('/car-report/payment', checkServiceEnabled(carReportAccessKey), payment);
router.get('/car-report/orders', checkServiceEnabled(carReportAccessKey), fetchCarReportOrders);
router.get('/car-report/orders/:orderId/detail', checkServiceEnabled(carReportAccessKey), fetchCarReportOrderDetail);

//documents
router.get('/documents', getAllUserDocuments);
router.post('/documents', validateGarageDocumentCreate, createDocument);
router.put('/documents/:id', validateGarageDocumentUpdate, updateDocument);
router.delete('/documents/:id', deleteDocuments);
router.get('/documents/:id', getDocumentDetails)

module.exports = router