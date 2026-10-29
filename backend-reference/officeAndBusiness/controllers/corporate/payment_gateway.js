/* eslint-disable no-unused-vars */
/* eslint-disable no-prototype-builtins */
const {
    findAllPaymentLinks,
    createPaymentLink
} = require('../../models/use-cases/quickLinks')
const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const axios = require('axios')
const {
    fetchServiceDetails,
    findServiceOperatorByAccessKey
} = require('./../../utils/checkAndFetchServiceDetails')
const accessKey = 'REDACTED'
const serviceType = '3'
const paymentGatewayOrders = require('./../../models/entities/paymentGatewayOrders')
const { getValue, setValue } = require('../../utils/cacheDataMethods')
const { customLog } = require('../../utils/loggerHelper')
const accessKeyCollection = ['DUCTOP', 'du', 'etisalat_direct', 'etisalat_bill', 'fewa_direct', 'sewa_direct', 'aadc_direct', 'addc_direct', 'lootah', 'ajman_direct', 'salik_direct', 'mawaqif', 'nol', 'dubai_ded'];


async function getAccessToken(details, accessKey) {
    const REALM = process.env.NODE_ENV == 'staging' ? 'ni' : 'networkinternational'
    let isTokenData = await getValue(`access_token-${accessKey}`);
    if (isTokenData) {
        return isTokenData
    } else {
        let config = {
            method: 'post',
            url: `${details['apiUrl']}/identity/auth/access-token`,
            headers: {
                'Content-Type': 'application/vnd.ni-identity.v1+json',
                'Authorization': `Basic ${process.env.NI_PAYMENT_GATEWAY_KEY}`
            },
            data: {
                grant_type: 'client_credentials',
                realm: REALM,
            }
        };
        let response = await axios(config)
        if (response && response.data && response.data.access_token) {
            let access_token = response.data.access_token
            let expiry = response.data.expires_in
            await setValue(`access_token-${accessKey}`, expiry, access_token);
            return access_token
        } else {
            return false
        }
    }
}

exports.createOrder = asyncHandler(async (req, res, next) => {
    try {
        const credentialId = req.user.id //will come from userObject
        const packageId = req.user.packageId //will come from userObject

        const serviceDetails = await fetchServiceDetails({
            credentialId,
            accessKey,
            serviceType,
            packageId
        })
        if (serviceDetails.hasOwnProperty('error')) {
            await customLog(
                req?.LogTraceId,
                "error",
                {
                    message: "Error fetching service details",
                    error: serviceDetails.error,
                    serviceDetails,
                }

            );
            return next(new ErrorResponse(serviceDetails['error'], 200))
        }
        let paymentRefId = new Date().valueOf().toString();

        let vendorUrl = serviceDetails.vendor.apiUrl

        await paymentGatewayOrders.create({
            paymentRefId,
            paymentData: JSON.stringify(req.body)
        })
        //Retrieve the current page address from the body and send it to the gateway to return to our server after payment.
        const pageAddress = req.body.pageAddress
        let baseUrl
        if (pageAddress) {
            baseUrl = pageAddress.split('/').slice(0, -1).join('/');
        }
        let URL = `${baseUrl}/paymentGateway`

        // get access token 
        let accessToken = await getAccessToken(serviceDetails.vendor, accessKey)

        //checking if telecom,utility or license renewal
        const isInCollection = accessKeyCollection.includes(req.body.accessKey);
        const outletReference = isInCollection ? serviceDetails.vendor['optional3'] : serviceDetails.vendor['optional1'];

        //create order
        let config = {
            method: 'post',
            url: `${vendorUrl}/transactions/outlets/${outletReference}/orders`,
            headers: {
                'Content-Type': 'application/vnd.ni-payment.v2+json',
                'Accept': 'application/vnd.ni-payment.v2+json',
                'Authorization': `Bearer ${accessToken}`
            },
            data: {
                "action": "SALE",
                "amount": {
                    "currencyCode": "AED",
                    "value": parseFloat((req.body.pgAmount * 100).toFixed(2))  //convert into smallest unit
                },
                "emailAddress": req.user.email,
                "language": "en",
                "billingAddress": {   //optional
                    "firstName": req.user.name,
                    "city": req.user.city,
                    "countryCode": "UAE"
                },
                "merchantOrderReference": paymentRefId,
                "merchantAttributes": {
                    "redirectUrl": URL + '/' + paymentRefId,
                    "cancelUrl": pageAddress,
                    "cancelText": "Return to Basket",
                    "skipConfirmationPage": true,
                    "maskPaymentInfo": true
                }
            }
        };
        customLog(req?.LogTraceId, "info", { config, body: req.body, amount: config.data.amount }, "VENDOR", ["Authorization"])
        axios.request(config)
            .then(async (response) => {
                if (response.data.reference && response.data._links.hasOwnProperty('payment')) {
                    await paymentGatewayOrders.update({
                        status: 'ORDERED',
                        referenceNo: response.data.reference
                    }, {
                        where: { paymentRefId }
                    })
                    return res.status(201).json({
                        status: true,
                        orderData: response.data,
                        redirectLink: response.data._links.payment.href
                    });
                } else {
                    return res.status(201).json({
                        status: false,
                        message: 'Something went wrong while creating order'
                    });
                }
            }).catch((err) => {
                customLog(req?.LogTraceId, "error", { message: err?.message, data: err?.response?.data }, "VENDOR")
                return next(new ErrorResponse('Something went wrong while creating order', 200))
            })
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
        return next(new ErrorResponse('Something went wrong while creating order', 200))
    }
})

exports.createOrderMobile = asyncHandler(async (req, res, next) => {
    try {
        const credentialId = req.user.id
        const packageId = req.user.packageId

        // get service details
        const serviceDetails = await fetchServiceDetails({
            credentialId,
            accessKey,
            serviceType,
            packageId
        })
        if (serviceDetails.hasOwnProperty('error')) {
            await customLog(
                req?.LogTraceId,
                "error",
                {
                    message: "Error fetching service details",
                    error: serviceDetails.error,
                    serviceDetails,
                }

            );
            return next(new ErrorResponse(serviceDetails['error'], 200))
        }
        let paymentRefId = new Date().valueOf()
        let vendorUrl = serviceDetails.vendor.apiUrl
        await paymentGatewayOrders.create({
            paymentRefId,
            paymentData: JSON.stringify(req.body)
        })
        let accessToken = await getAccessToken(serviceDetails.vendor, accessKey)
        let config = {
            method: 'post',
            url: `${vendorUrl}/transactions/outlets/${serviceDetails.vendor['optional1']}/orders`,
            headers: {
                'Content-Type': 'application/vnd.ni-payment.v2+json',
                'Accept': 'application/vnd.ni-payment.v2+json',
                'Authorization': `Bearer ${accessToken}`
            },
            data: {
                "action": "SALE",
                "amount": {
                    "currencyCode": "AED",
                    "value": req.body.pgAmount * 100 //convert into smallest unit
                },
                "emailAddress": req.user.email,
                "language": "en",
                "billingAddress": {   //optional
                    "firstName": req.user.name,
                    "city": req.user.city,
                    "countryCode": "UAE"
                },
                "merchantOrderReference": paymentRefId
            }
        };
        axios.request(config)
            .then(async (response) => {
                if (response.data.reference && response.data._links.hasOwnProperty('payment')) {
                    await paymentGatewayOrders.update({
                        status: 'ORDERED',
                        referenceNo: response.data.reference
                    }, {
                        where: { paymentRefId }
                    })
                    return res.status(201).json({
                        status: true,
                        orderData: response.data
                    });
                } else {
                    return res.status(201).json({
                        status: false,
                        message: 'Something went wrong while creating order'
                    });
                }
            })
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
        return next(new ErrorResponse('Something went wrong while creating order', 200))
    }
})

exports.checkStatus = async function (req, orderReference, serviceAccessKey = '') {
    const credentialId = req.user.id
    const packageId = req.user.packageId
    const serviceDetails = await fetchServiceDetails({
        credentialId,
        accessKey,
        serviceType,
        packageId
    })
    if (serviceDetails.hasOwnProperty('error')) {
        await customLog(
            req?.LogTraceId,
            "error",
            {
                message: "Error fetching service details",
                error: serviceDetails.error,
                serviceDetails,
            }

        );
        throw new Error(serviceDetails['error'])
    }
    let vendorUrl = serviceDetails.vendor.apiUrl
    // get access token 
    let accessToken = await getAccessToken(serviceDetails.vendor, accessKey)

    //checking if telecom,utility or license renewal
    const isInCollection = accessKeyCollection.includes(serviceAccessKey);
    const outletReference = isInCollection ? serviceDetails.vendor['optional3'] : serviceDetails.vendor['optional1'];

    //api call for getting order details ( success or failure )
    let config = {
        method: 'get',
        url: `${vendorUrl}/transactions/outlets/${outletReference}/orders/${orderReference}`,
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    };
    const response = await axios.request(config)
    return response?.data
}

// NB: "Not valid for payments already credited or refunded.Possible for same day of transaction initiated
async function cancelCardTransaction(req, paymentData, serviceAccessKey = '') {
    try {
        const orderReference = paymentData.orderReferenceNo
        const serviceDetails = await findServiceOperatorByAccessKey(accessKey)
        if (serviceDetails.hasOwnProperty('error')) {
            return { state: serviceDetails['error'] }
        }

        //checking refund for telecom,utility or license renewal
        const isInCollection = accessKeyCollection.includes(serviceAccessKey);
        const outletReference = isInCollection ? serviceDetails.vendor['optional3'] : serviceDetails.vendor['optional1'];

        let vendorUrl = serviceDetails.vendor.apiUrl
        let accessToken = await getAccessToken(serviceDetails.vendor, accessKey)
        let config = {
            method: 'get',
            url: `${vendorUrl}/transactions/outlets/${outletReference}/orders/${orderReference}`,
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        };
        const response = await axios.request(config)
        let paymentStatus = response?.data
        // only the captured state will possible for cancellation
        if (paymentStatus?._embedded?.payment[0]?.state == 'CAPTURED') {

            // cancel captured request
            let config = {
                method: 'DELETE',
                url: `${vendorUrl}/transactions/outlets/${outletReference}/orders/${paymentData.orderReferenceNo}/payments/${paymentData.paymentReferenceNo}/captures/${paymentData.captureReferenceNo}`,
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    "Content-Type": "application/vnd.ni-payment.v2+json",
                    "Accept": "application/vnd.ni-payment.v2+json"
                }
            };
            const captureCancelResponse = await axios.request(config)

            // after cancel capture request state will be authorised
            if (captureCancelResponse?.data?.state == 'AUTHORISED') {
                // then cancel the authorised payment
                let config2 = {
                    method: 'PUT',
                    url: `${vendorUrl}/transactions/outlets/${outletReference}/orders/${paymentData.orderReferenceNo}/payments/${paymentData.paymentReferenceNo}/cancel`,
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        "Content-Type": "application/vnd.ni-payment.v2+json",
                        "Accept": "application/vnd.ni-payment.v2+json"
                    }
                };
                const response = await axios.request(config2)
                customLog(req?.LogTraceId, "info", response?.data, "VENDOR")
                return response?.data
            }
        } else {
            return { state: 'Please try a refund request' }
        }
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
        return { state: 'Unable to process refund request' }
    }
}

exports.refundCardTransaction = async function (req, paymentData, partialAmount = false, serviceAccessKey = '') {
    try {
        customLog(req?.LogTraceId, "info", { message: "inside refund card transaction", partialAmount })

        if (partialAmount && partialAmount > paymentData?.pgAmount) {
            return { state: 'refund amount must be less than total order amount' }
        }
        if (!partialAmount) {
            // same day refund request
            let refundPGResponse = await cancelCardTransaction(req, paymentData)
            if (refundPGResponse?.state == 'REVERSED') {
                return refundPGResponse
            }
        }

        //Refund for past dated transaction.
        const serviceDetails = await findServiceOperatorByAccessKey(accessKey)
        if (serviceDetails.hasOwnProperty('error')) {
            return { state: serviceDetails['error'] }
        }
        //checking refund for telecom,utility or license renewal
        const isInCollection = accessKeyCollection.includes(serviceAccessKey);
        const outletReference = isInCollection ? serviceDetails.vendor['optional3'] : serviceDetails.vendor['optional1'];


        let refundAmount;
        // full refund or partial refund
        if (partialAmount) {
            refundAmount = parseFloat((partialAmount * 100).toFixed(2))
        } else {
            refundAmount = paymentData?.amount?.value
        }

        let vendorUrl = serviceDetails.vendor.apiUrl
        let accessToken = await getAccessToken(serviceDetails.vendor, accessKey)
        let config = {
            method: 'get',
            url: `${vendorUrl}/transactions/outlets/${outletReference}/orders/${paymentData.orderReferenceNo}`,
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        };
        const response = await axios.request(config)
        const paymentStatus = response?.data
        if (paymentStatus?._embedded?.payment?.[0]?._embedded?.["cnp:capture"]?.[0]?._links?.["cnp:refund"]) {

            let config = {
                method: 'POST',
                url: `${vendorUrl}/transactions/outlets/${outletReference}/orders/${paymentData.orderReferenceNo}/payments/${paymentData.paymentReferenceNo}/captures/${paymentData.captureReferenceNo}/refund`,
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    "Content-Type": "application/vnd.ni-payment.v2+json",
                    "Accept": "application/vnd.ni-payment.v2+json"
                },
                data: {
                    "amount": { "currencyCode": "AED", "value": refundAmount }
                }
            };
            const response = await axios.request(config)
            return response?.data
        } else {
            customLog(req?.LogTraceId, "error", { message: "Unable to process refund request at this moment", paymentStatus }, "VENDOR")
            return { state: 'Unable to process refund request at this moment' }
        }
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
        return { state: 'Unable to process refund request at this moment' }
    }
}

exports.findAllLinksAndCount = asyncHandler(async (req, res, next) => {
    const from = req.query.fromDate
    const to = req.query.toDate
    const corporateId = parseInt(req.params.corporateId) || parseInt(req.query.corporateId)
    const start = parseInt(req.query.start)
    const details = req.query.details || false
    const length = parseInt(req.query.length)
    const draw = parseInt(req.query.draw)
    let searchText = req.query.search.value
    let order = req.query.orderCol,
        column = 'createdAt' //req.query.column
    let params = {
        corporateId,
        from,
        to,
        start,
        length,
        draw,
        searchText,
        order,
        details,
        column
    }
    const quickLinksData = await findAllPaymentLinks(params);
    if (!quickLinksData) {
        return next(new ErrorResponse(`Something went wrong while fetching payment links from the database`, 200))
    } else {
        return res.status(200).json({
            'success': true,
            'draw': draw,
            'recordsTotal': quickLinksData.count,
            'recordsFiltered': quickLinksData.count,
            'data': quickLinksData.rows
        })
    }

})

exports.cancelCardTransaction = cancelCardTransaction;