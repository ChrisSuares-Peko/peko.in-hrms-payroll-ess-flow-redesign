/* eslint-disable no-unused-vars */
/* eslint-disable no-prototype-builtins */
const axios = require('axios')
const {
    fetchServiceDetails
} = require('./../../utils/checkAndFetchServiceDetails')
const accessKey = 'REDACTED'
const { getValue, setValue } = require('../../utils/cacheDataMethods');
const { customLog } = require('../../utils/loggerHelper');
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


// NB: "Not valid for payments already credited or refunded.Possible for same day of transaction initiated
async function cancelCardTransaction(req, paymentData, serviceAccessKey = '') {
    try {
        const credentialId = req.user.id
        const packageId = 1
        const orderReference = paymentData.orderReferenceNo
        const serviceDetails = await fetchServiceDetails({
            credentialId,
            accessKey,
            packageId
        })
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
                customLog(req?.LogTraceId, "info", { response: response?.data, message:"result from cancel payment" }, "VENDOR")
                return response?.data
            }
        } else {
            return { state: 'Please try a refund request' }
        }
    } catch (error) {
        customLog(req?.LogTraceId, "error", { response: error, message:"result from cancel payment" }, "VENDOR")
        return { state: 'Unable to process refund request' }
    }
}

exports.refundCardTransaction = async function (req, paymentData, partialAmout = false, serviceAccessKey = '') {
    try {
        customLog(req?.LogTraceId, "info", { partialAmout, message:"::inside refund card transaction" })

        if (partialAmout && partialAmout > paymentData.amount.value) {
            return { state: 'refund amount must be less than total order amount' }
        }
        if (!partialAmout) {
            // same day refund request
            let refundPGResponse = await cancelCardTransaction(req, paymentData)
            if (refundPGResponse?.state == 'REVERSED') {
                return refundPGResponse
            }
        }

        //Refund for past dated transaction.
        const credentialId = req.user.id
        const packageId = 1
        const serviceDetails = await fetchServiceDetails({
            credentialId,
            accessKey,
            packageId
        })
        if (serviceDetails.hasOwnProperty('error')) {
            return { state: serviceDetails['error'] }
        }
        //checking refund for telecom,utility or license renewal
        const isInCollection = accessKeyCollection.includes(serviceAccessKey);
        const outletReference = isInCollection ? serviceDetails.vendor['optional3'] : serviceDetails.vendor['optional1'];


        let refundAmout;
        // full refund or partial refund
        if (partialAmout) {
            refundAmout = partialAmout
        } else {
            refundAmout = paymentData.amount.value
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
                    "amount": { "currencyCode": "INR", "value": parseFloat((refundAmout * 100).toFixed(2)) }
                }
            };
            const response = await axios.request(config)
            return response?.data
        } else {
            return { state: 'Unable to process refund request at this moment' }
        }
    } catch (error) {
        customLog(req?.LogTraceId, "error", { response: error?.response?.data ?? error?.response ?? error, message: "Unable to process refund request at this moment" }, "VENDOR")
        
        return { state: 'Unable to process refund request at this moment' }
    }
}


exports.cancelCardTransaction = cancelCardTransaction;