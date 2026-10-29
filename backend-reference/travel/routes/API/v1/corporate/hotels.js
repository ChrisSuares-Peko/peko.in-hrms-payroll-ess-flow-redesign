const express = require('express')
const router = express.Router()


const { countryLists, cityLists, hotelDetails, prebook, sendChangeRequest, listAllBookings, getCancellationStatus, getOtpCancel, downloadBookingTicket, balanceCkeck, searchHotels } = require('../../../../controllers/corporate/hotel')
const { validateDownloadTicketQuery, validateHotelCancelOtpQuery, validateListBookingsQuery } = require('../../../../utils/apiValidation/queryValidation')
const operatorsData = require('../../../../utils/operatorsData.json')
const { checkServiceEnabled } = require('../../../../middlewares/disableServiceCheck')
const accessKey = operatorsData.hotel.accessKey

router.use(checkServiceEnabled(accessKey))

router.post('/cities', cityLists)
router.get('/countries', countryLists)

router.post('/hotelSearch', searchHotels)

router.post('/hotelDetails', hotelDetails)
router.post('/preBook', prebook)
router.get('/download-bookingTicket', validateDownloadTicketQuery, downloadBookingTicket);
router.get('/hotel-cancel/get-otp', validateHotelCancelOtpQuery, getOtpCancel)
router.post('/cancelRequest', sendChangeRequest)
router.post('/cancellation-status', getCancellationStatus)
router.get('/list-all-bookings', validateListBookingsQuery, listAllBookings);
router.post('/balance', balanceCkeck)
// router.post('/payment', payment)

module.exports = router