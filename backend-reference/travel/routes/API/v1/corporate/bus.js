const express = require('express');
const router = express.Router();

const {
    getCities,
    searchBuses,
    getTripDetails,
    getBoardingPoints,
    getBpdpDetails,
    blockTicket,
    bookTicket,
    listBookings,
    getCancellationData,
    cancelTicket,
    downloadTicket,
    getBookingDetails,
} = require('../../../../controllers/corporate/bus');

const operatorsData = require('../../../../utils/operatorsData.json');
const { checkServiceEnabled } = require('../../../../middlewares/disableServiceCheck');
const { validateCancelTicket } = require('../../../../middlewares/busValidation');

const accessKey = operatorsData.bus.accessKey;

router.use(checkServiceEnabled(accessKey));

router.get('/cities', getCities);
router.get('/search', searchBuses);
router.get('/trip-details', getTripDetails);
router.get('/boarding-points', getBoardingPoints);
router.get('/bpdp-details', getBpdpDetails);
router.post('/block', blockTicket);
router.post('/book', bookTicket);
router.get('/bookings', listBookings);
router.get('/cancellation-data', getCancellationData);
router.post('/cancel', validateCancelTicket, cancelTicket);
router.get('/download-ticket', downloadTicket);
router.get('/booking-details', getBookingDetails);

module.exports = router;
