const express = require('express');
const { fetchVehicleChallans, fetchFleetChallans, fetchChallanOrders, fetchChallanOrderDetail, payment } = require('../../../../controllers/corporate/challan');
const operatorsData = require('../../../../utils/operatorsData.json');
const { checkServiceEnabled } = require('../../../../middlewares/disableServiceCheck');

const accessKey = operatorsData.challan.accessKey;
const router = express.Router();

// Traffic Challan (Droom). Fleet aggregation (Turbo) reads the corporate's vehicle list
// from the shared garage_fleets table, then loops Droom get-challan.
router.get('/fetch', checkServiceEnabled(accessKey), fetchVehicleChallans);
router.get('/fleet', checkServiceEnabled(accessKey), fetchFleetChallans);
router.get('/orders', checkServiceEnabled(accessKey), fetchChallanOrders);
router.get('/orders/:orderId/detail', checkServiceEnabled(accessKey), fetchChallanOrderDetail);
router.post('/payment', checkServiceEnabled(accessKey), payment);

module.exports = router;
