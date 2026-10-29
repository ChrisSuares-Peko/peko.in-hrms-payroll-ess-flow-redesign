const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const axios = require('axios')
const { findServiceOperatorByAccessKey } = require('../../utils/checkAndFetchServiceDetails')
const accessKey = 'REDACTED'
const paymentGatewayOrders = require('../../models/entities/paymentGatewayOrders')
const { ORDER_KIND } = require('../../constants/orderKind')
const { uploadAndSetDocument, uploadAndSetDocumentForTradeLicenseDoc } = require('../../middlewares/fileUpload')
const { findOneSavedCard } = require('../../models/use-cases/savedCards')
const { setValue, getValue } = require('../../utils/cacheDataMethods')
const { customLog } = require('../../utils/loggerHelper')
const { uploadFile } = require('../../utils/commonUploadFile')
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

        const credentialId = req.user.id
        const corporateUserId = req.user.corporateId
        const currentPageUrl = req.body.currentUrl;
        const data = req.body
        const serviceDetails = await findServiceOperatorByAccessKey(accessKey)
        if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
            return next(new ErrorResponse(serviceDetails['error'], 400))
        }
        let paymentRefId = new Date().valueOf().toString();

        let vendorUrl = serviceDetails.vendor.apiUrl;
        let tradeLicenseDoc
        if (req.body.accessKey == 'corporateTaxRegistration') {
            await uploadAndSetDocument(data, req.user)
            if (data.tradeLicenseDoc && Array.isArray(data.tradeLicenseDoc)) {
                tradeLicenseDoc = data.tradeLicenseDoc
                for (let i = 0; i < tradeLicenseDoc.length; i++) {
                    let doc = tradeLicenseDoc[i]
                    await uploadAndSetDocumentForTradeLicenseDoc(doc)
                }
            }
        }


        if (req.body.accessKey == 'vatRegistration') {

            // const data=req.body
            const filePath = `vatRegistration`;

            if (data.addressProof && data.addressProofFormat) {

                const addressProofUrl = await uploadFile(
                    data.addressProof,
                    filePath,
                    data.addressProofFormat
                );

                if (!addressProofUrl) {
                    return next(new ErrorResponse(`Something went wrong while uploading logo`, 500));
                }
                data.addressProofDoc = addressProofUrl;
                delete data.addressProof
            }


            if (data.tradeLicense && data.tradeLicenseFormat) {
                const tradeLicenseUrl = await uploadFile(
                    data.tradeLicense,
                    filePath,
                    data.tradeLicenseFormat
                );
                if (!tradeLicenseUrl) {
                    return next(new ErrorResponse(`Something went wrong while uploading logo`, 500));
                }
                data.tradeLicenseDoc = tradeLicenseUrl;
                delete data.tradeLicense
            }


            if (data.financialStatements && data.financialStatementsFormat) {
                const financialStatementsUrl = await uploadFile(
                    data.financialStatements,
                    filePath,
                    data.financialStatementsFormat
                );
                if (!financialStatementsUrl) {
                    return next(new ErrorResponse(`Something went wrong while uploading logo`, 500));
                }
                data.financialStatementDoc = financialStatementsUrl;
                delete data.financialStatements
            }


            if (data.emiratesID && data.emiratesIDFormat) {
                const emiratesIDUrl = await uploadFile(
                    data.emiratesID,
                    filePath,
                    data.emiratesIDFormat
                );
                if (!emiratesIDUrl) {
                    return next(new ErrorResponse(`Something went wrong while uploading logo`, 500));
                }
                data.emiratesIDDoc = emiratesIDUrl;
                delete data.emiratesID
            }

        }

        if (req.user.role === 'CORPORATE_SUB_USER') {
            await paymentGatewayOrders.create({
                paymentRefId,
                orderKind: ORDER_KIND.PAYMENT_GATEWAY,
                paymentData: JSON.stringify({
                    ...req.body,
                    paymentRefId,
                    role: req.user.role,
                    subCorporateId: req.user.subCorporateId,
                    subCorporateUsername: req.user.subCorporateUsername,
                    subCorporateEmail: req.user.subCorporateEmail
                }),
                credentialId: credentialId
            });
        } else {
            await paymentGatewayOrders.create({
                paymentRefId,
                orderKind: ORDER_KIND.PAYMENT_GATEWAY,
                paymentData: JSON.stringify({
                    ...req.body,
                    paymentRefId
                }),
                credentialId: credentialId
            });
        }


        let callback_URL;
        if (process.env.GATEWAY_ENV === 'local') {
            callback_URL = `http://127.0.0.1:3000/api/v1/corporate/${req.params.corporateId}/paymentGateway/ni-payments/callback`
        } else if (process.env.GATEWAY_ENV === 'staging') {
            callback_URL = `${process.env.PG_URL}/api/v1/corporate/${req.params.corporateId}/paymentGateway/ni-payments/callback`
        } else if (process.env.GATEWAY_ENV === 'production') {
            callback_URL = `${process.env.PG_URL}/api/v1/corporate/${req.params.corporateId}/paymentGateway/ni-payments/callback`
        }

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
                    "currencyCode": "INR",
                    "value": parseFloat((req.body.pgAmount * 100).toFixed())
                },
                "emailAddress": req.user.email,
                "language": "en",
                "billingAddress": {   //optional
                    "firstName": req.user.name,
                    "city": req.user.city,
                    "countryCode": "AE"
                },
                "merchantOrderReference": paymentRefId,
                "merchantAttributes": {
                    "redirectUrl": callback_URL + '/' + paymentRefId,
                    "cancelUrl": currentPageUrl,
                    "cancelText": "Return to Basket",
                    "skipConfirmationPage": true,
                    "maskPaymentInfo": true
                }
            }
        };

        // fetch saved card details from database.
        let userSavedCard;
        if (req.user.role === 'CORPORATE_SUB_USER') {
            userSavedCard = await findOneSavedCard({ subCorporateUserId: req.user.subCorporateId })
        } else {
            userSavedCard = await findOneSavedCard({ corporateUserId: corporateUserId })
        }

        if (userSavedCard) {
            config.data.savedCard = {
                ...userSavedCard,
            }
            config.data.recaptureCsc = true
        }

        axios.request(config)
            .then(async (response) => {
                if (response.data.reference && Object.prototype.hasOwnProperty.call(response.data._links, 'payment')) {
                    await paymentGatewayOrders.update({
                        status: 'ORDERED',
                        referenceNo: response.data.reference
                    }, {
                        where: { paymentRefId }
                    })
                    return res.status(201).json({
                        status: true,
                        data: {
                            redirectLink: response.data._links.payment.href
                        },
                        message: 'redirect url created successfully',
                        responseCode: '000'

                    });
                } else {
                    return res.status(400).json({
                        status: false,
                        message: 'Something went wrong while creating order',
                        data: {},
                        responseCode: '001'
                    });
                }
            }).catch((err) => {
                customLog(req?.LogTraceId, "error", { message: err?.message, data: err?.response?.data }, "VENDOR")
                return next(new ErrorResponse('Something went wrong while creating order', 400))
            })
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
        return next(new ErrorResponse('Something went wrong while creating order', 400))
    }
})

exports.createOrderMobile = asyncHandler(async (req, res, next) => {
    try {
        const corporateUserId = req.user.corporateId;
        const data = req.body;

        customLog(req?.LogTraceId, "info", { body: req.body, type: typeof (req.body) })


        // get service details
        const serviceDetails = await findServiceOperatorByAccessKey(accessKey)
        if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
            return next(new ErrorResponse(serviceDetails['error'], 400))
        }
        let paymentRefId = new Date().valueOf().toString();
        let vendorUrl = serviceDetails.vendor.apiUrl

        let tradeLicenseDoc
        if (req.body.accessKey == 'corporateTaxRegistration') {
            await uploadAndSetDocument(data, req.user)
            if (data.tradeLicenseDoc && Array.isArray(data.tradeLicenseDoc)) {
                tradeLicenseDoc = data.tradeLicenseDoc
                for (let i = 0; i < tradeLicenseDoc.length; i++) {
                    let doc = tradeLicenseDoc[i]
                    await uploadAndSetDocumentForTradeLicenseDoc(doc)
                }
            }
        }

        await paymentGatewayOrders.create({
            paymentRefId,
            orderKind: ORDER_KIND.PAYMENT_GATEWAY,
            paymentData: JSON.stringify(req.body)
        })

        let accessToken = await getAccessToken(serviceDetails.vendor, accessKey)

        //checking if telecom,utility or license renewal
        const isInCollection = accessKeyCollection.includes(req.body.accessKey);
        const outletReference = isInCollection ? serviceDetails.vendor['optional3'] : serviceDetails.vendor['optional1'];

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
                    "currencyCode": "INR",
                    "value": parseFloat((req.body.pgAmount * 100).toFixed(2))
                },
                "emailAddress": req.user.email,
                "language": "en",
                "billingAddress": {   //optional
                    "firstName": req.user.name,
                    "city": req.user.city,
                    "countryCode": "UAE"
                },
                "merchantOrderReference": paymentRefId,
            }
        };

        const userSavedCard = await findOneSavedCard({ corporateUserId })
        if (userSavedCard) {
            config.data.savedCard = {
                ...userSavedCard,
            }
            config.data.recaptureCsc = false
        }

        axios.request(config)
            .then(async (response) => {
                if (response.data.reference && Object.prototype.hasOwnProperty.call(response.data._links, 'payment')) {
                    await paymentGatewayOrders.update({
                        status: 'ORDERED',
                        referenceNo: response.data.reference
                    }, {
                        where: { paymentRefId }
                    })
                    return res.status(201).json({
                        status: true,
                        data: { data: response.data, paymentRefId },
                        message: 'order created successfully',
                        responseCode: '000'
                    });
                } else {
                    return res.status(400).json({
                        status: false,
                        message: 'Something went wrong while creating order',
                        data: {},
                        responseCode: '001'
                    });
                }
            })
    } catch (err) {
        customLog(req?.LogTraceId, "error", { message: err?.message, data: err?.response?.data })
        return next(new ErrorResponse('Something went wrong while creating order', 400))
    }
})

exports.checkStatus = async function (orderReference, serviceAccessKey = '') {
    const serviceDetails = await findServiceOperatorByAccessKey(accessKey)
    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
        return new ErrorResponse(serviceDetails['error'])
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
        if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
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
        if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
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
                    "amount": { "currencyCode": "INR", "value": refundAmount }
                }
            };
            const response = await axios.request(config)
            return response?.data
        } else {
            customLog(req?.LogTraceId, "info", { paymentStatus }, "VENDOR")
            return { state: 'Unable to process refund request at this moment' }
        }
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
        return { state: 'Unable to process refund request at this moment' }
    }
}


exports.cancelCardTransaction = cancelCardTransaction;