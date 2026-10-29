const express = require('express')
const router = express.Router()
const { listAllCancelled, listAllModification,
    listAllCancelledPDF, listAllCancelledExcelCSV,
    listAllModificationExcelCSV, listAllModificationPDF,
    refund,
    listAllBookings,
    listAllBookingPDF,
    listAllBookingExcelCSV
} = require('../../../../controllers/admin/flight')
const { downloadBookingTicket } = require('../../../../controllers/corporate/airline')
const { getAirports, addAirport, updateAirportPriority } = require('../../../../controllers/admin/airline')
const { validateCancelledBookingsQuery, validatelistAllModificationQuery, validateAddAirport } = require('../../../../utils/apiValidation/queryValidation')

router.get('/list-cancelled-booking', validateCancelledBookingsQuery, listAllCancelled)
router.get('/list-cancelled-booking/pdf', validateCancelledBookingsQuery, listAllCancelledPDF)
router.get('/list-cancelled-booking/:type', validateCancelledBookingsQuery, listAllCancelledExcelCSV)
// router.post('/refund-cancelled-booking', refundCancelledBooking)

router.get('/list-modification-requests', validatelistAllModificationQuery, listAllModification)
router.get('/list-modification-requests/pdf', validatelistAllModificationQuery, listAllModificationPDF)
router.get('/list-modification-requests/:type', validatelistAllModificationQuery, listAllModificationExcelCSV)

router.post('/refund-cancelled-booking', refund)

router.get('/list-all-booking', listAllBookings)
router.get('/list-all-booking/pdf', listAllBookingPDF)
router.get('/list-all-booking/:type', listAllBookingExcelCSV)
router.post('/download-bookingTicket', downloadBookingTicket)  


router.get('/airports', getAirports)
router.post('/airports', validateAddAirport, addAirport)
router.patch('/airports/:id', updateAirportPriority)

// router.get('/modification-request', modificationRequest)
// router.post('/modification-request/price-update', validateAirlinePriceUpdate, modificationPriceUpdate)
// router.post('/modification-request/ticket-update', handleModifiedAirTicketUpload, modificationTicketUpdate)
// router.post('/modification-request/cancel-and-refund', cancelAndRefundModification)

module.exports = router