const express = require('express')
const { fetchServiceDetails } = require("../../../../utils/checkAndFetchServiceDetails");
const ErrorResponse = require('../../../../utils/error-response')
const router = express.Router()

router.get('/', async function (req, res,next) {
    const credentialId = req.user.id
    const packageId = req.user.packageId
    const accessKey = req.query.accessKey
    const orderAmount = req.query.amount
    
    const serviceDetails = await fetchServiceDetails({
        credentialId,
        accessKey,
        packageId
    })
    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
        return next(new ErrorResponse(serviceDetails['error'], 400))
    }
   


    function calculateCorporateCashbackWillEarn(orderAmount) {
        let totalCashback = 0;
        let corporateCashback = serviceDetails.cashback
        if (serviceDetails.commissionType === 'PERCENTAGE') {
            totalCashback = (parseFloat(orderAmount) * parseFloat(serviceDetails.providerCommission / 100)).toFixed(2)
        } else {
            totalCashback = serviceDetails.providerCommission
        }
        if (serviceDetails.cashbackType === "PERCENTAGE") {
            corporateCashback = (parseFloat(totalCashback) * parseFloat(corporateCashback / 100)).toFixed(2)
        }
        return corporateCashback;
    }

    return res.status(200).json({
        'status': true,
        'data': {
            surcharge: serviceDetails.surcharge,
            corporateCashback: calculateCorporateCashbackWillEarn(orderAmount) 
        },
        'message':'Service details fetched successfully',
        'responseCode': '000'
    })
})

module.exports = router