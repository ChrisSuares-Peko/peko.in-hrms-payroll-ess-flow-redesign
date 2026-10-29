const express = require('express')
const { listAllCancelled, refundCancelledBooking, listAllCancelledPDF, listAllCancelledExcelCSV, listAllBookings, listAllBookingPDF, listAllBookingExcelCSV } = require('../../../../controllers/admin/hotels');
const { fetchAllCancelledHotelBookingsValidation } = require('../../../../utils/apiValidation/queryValidation');
const { downloadBookingTicket } = require('../../../../controllers/corporate/hotel')

const router = express.Router()

router.get("/list-cancelled-booking", fetchAllCancelledHotelBookingsValidation, listAllCancelled
);
router.get('/list-cancelled-booking/pdf', fetchAllCancelledHotelBookingsValidation, listAllCancelledPDF)
router.get('/list-cancelled-booking/:type', fetchAllCancelledHotelBookingsValidation, listAllCancelledExcelCSV)
router.post('/refund-cancelled-booking', refundCancelledBooking)
router.get('/list-all-booking', listAllBookings)
router.get('/list-all-booking/pdf', listAllBookingPDF)
router.get('/list-all-booking/:type', listAllBookingExcelCSV)
router.get('/download-bookingTicket', downloadBookingTicket)

module.exports = router