const express = require('express');
const router = express.Router({ mergeParams: true })
const { verifyUser } = require('../../../../middlewares/verifySubCorporate');
const { checkDeliveryFee, checkInternationalDeliveryFee, payment, cancelShipment, fetchCountries, trackShipments, downloadInvoice, downloadLabel, checkAgencyBalance, orderHistory, getCityList, getCityDetails, lookupPostcode, lookupInternationalPostcode, uploadBusinessPan, checkBusinessPan } = require('../../../../controllers/corporate/logistics_V3');
const { findAllAddress, addAddress, updateAddress, deleteAddress, setDefaultAddress } = require('../../../../controllers/admin/corporateUser');
const { validateLogisticsAddAdress, validateLogisticsUpdateAddress, validateLogisticsdeliveryFee, validateLogisticsInternationalDeliveryFee, validateLogisticsCreateShipment, validateCancelShipment, validateTrackLogistics, validateBalanceCheck, validateBusinessPanUpload } = require('../../../../utils/apiValidation');

router.use(verifyUser('Logistics'));

// new api routes
router.get('/fetch-cities', getCityList);
router.get('/fetch-city-details', getCityDetails);
router.post('/check-delivery-fee', validateLogisticsdeliveryFee, checkDeliveryFee);
router.get('/fetchAddresses', findAllAddress);
router.post("/addAddress", validateLogisticsAddAdress, addAddress);
router.put('/updateAddress/:id', validateLogisticsUpdateAddress, updateAddress);
router.delete('/deleteAddress/:id', deleteAddress);
router.patch('/setDefaultAddress/:id', setDefaultAddress);
router.post('/check-balance', validateBalanceCheck, checkAgencyBalance)
router.post('/payment', validateLogisticsCreateShipment, payment);
router.get('/orders', orderHistory);
router.post('/track-shipment', validateTrackLogistics, trackShipments);
router.post('/cancel-shipment', validateCancelShipment, cancelShipment);
router.get('/download-invoice', downloadInvoice);
router.get('/download-label', downloadLabel);
router.get('/lookup-postcode', lookupPostcode);

// business pan
router.post('/upload-business-pan', validateBusinessPanUpload, uploadBusinessPan);
router.get('/check-business-pan', checkBusinessPan);

// international shipment
router.post('/check-international-delivery-fee', validateLogisticsInternationalDeliveryFee, checkInternationalDeliveryFee);
router.get('/lookup-international-postcode', lookupInternationalPostcode);

// old api routes
router.post('/fetchCountry', fetchCountries);
// router.get('/fetchCities', getCitiesByCountry);

// router.post('/track-shipment-history', trackFullShipmentHistory);
// router.post('/create-pickup-location', createNewPickupLocation);

module.exports = router