const express = require('express')
const router = express.Router()
// const {
//     // airports
//     // fareRules,
//     provBook,
//     // payment,
//     ancSearch,
//     ancProBook,
//     updateBookingStatus,
//     fetchData
// } = require('../../../../controllers/corporate/flight')

// const { validateFlightProvBook, validateFlightAncSearch, validateFlightAncProvBook } = require('../../../../utils/apiValidation')
const { searchFlights, airports, fetchFareRules, payment, booking, fetchSSR, fetchOneBooking, cancelBooking, getOtpCancel, cancellationCharges, downloadBookingTicket, validateAgencyBalance, listAllBookings, getFareCalendar } = require('../../../../controllers/corporate/airline')
const { validateFlightSearch, validateFareRules, validateSSR, validatePayment, validateBooking, validateAmount, validateCancellationCharge, validateFareCalendar } = require('../../../../utils/apiValidation/airline')
const validateAirlineWalletAmount = require('../../../../middlewares/airlinePaymentValidation')
const { validateAirportsQuery, validateBookingsQuery, validateBookingDetailsQuery, validateCancelOtpQuery } = require('../../../../utils/apiValidation/queryValidation')
const operatorsData = require('../../../../utils/operatorsData.json')
const { checkServiceEnabled } = require('../../../../middlewares/disableServiceCheck')
const accessKey = operatorsData.flight.accessKey

router.use(checkServiceEnabled(accessKey))
router.get('/airports', validateAirportsQuery, airports);
router.post('/searchTicket',validateFlightSearch, searchFlights)
router.post('/fare-calendar', validateFareCalendar, getFareCalendar)
router.post('/fetch_fareRules',validateFareRules, fetchFareRules)
router.post('/ssr',validateSSR, fetchSSR)

router.post('/booking', validateBooking, booking)
router.post('/validate-amount', validateAmount, validateAgencyBalance);
router.post('/payment', validatePayment, validateAirlineWalletAmount, payment)

router.get('/list-all-bookings', validateBookingsQuery, listAllBookings)
router.get('/booking-details', validateBookingDetailsQuery, fetchOneBooking)

router.get('/cancel/get-otp', validateCancelOtpQuery, getOtpCancel)
router.post('/cancel', cancelBooking)
router.post('/cancellation-charge', validateCancellationCharge, cancellationCharges)

router.post('/download-bookingTicket', downloadBookingTicket)


// ---- Unused Routes Section ----

// router.post('/fareRules', fareRules)
// router.post('/fareQuotes', fareQuotes)

// router.post('/ssr', flightSSR)

// router.post('/provBook',validateFlightProvBook, provBook)
// router.post('/payment',validateFlightPayment, paym   ent)

// router.post('/ancSearch',validateFlightAncSearch, ancSearch)
// router.post('/ancProBook',validateFlightAncProvBook, ancProBook)
// router.get('/update-status', updateBookingStatus) // ✅
// router.get('/fetch-data', fetchData)
module.exports = router