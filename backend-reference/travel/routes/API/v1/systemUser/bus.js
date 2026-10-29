const express = require('express');
const { listAllCancelled, listAllCancelledExcelCSV, listAllCancelledPDF, refundCancelledBooking } = require('../../../../controllers/admin/bus');
const router = express.Router();

router.get('/list-cancelled-booking', listAllCancelled);
router.get('/list-cancelled-booking/pdf', listAllCancelledPDF);
router.get('/list-cancelled-booking/:type', listAllCancelledExcelCSV);
router.post('/refund-cancelled-booking', refundCancelledBooking);

module.exports = router;
