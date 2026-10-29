/* eslint-disable no-inner-declarations */
/* eslint-disable no-undef */
/* eslint-disable no-prototype-builtins */
const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const axios = require('axios')
const { fetchServiceDetails } = require('../../utils/checkAndFetchServiceDetails')
const paymentGatewayOrders = require('../../models/entities/paymentGatewayOrders')
const jsSHA = require("jssha");
const crypto = require('crypto');
const { PLURAL_GATEWAY_ACCESS_KEY, PLURAL_GATEWAY_SERVICE_TYPE } = require('../../utils/constants');
const accessKey = PLURAL_GATEWAY_ACCESS_KEY
const serviceType = PLURAL_GATEWAY_SERVICE_TYPE

exports.createOrder = asyncHandler(async (req, res, next) => {
    try {
        const credentialId = req.user.id
        const packageId = req.user.packageId
        const serviceDetails = await fetchServiceDetails({
            credentialId,
            accessKey,
            serviceType,
            packageId
        })
        if (serviceDetails.hasOwnProperty('error')) {
            return next(new ErrorResponse(serviceDetails['error'], 400))
        }

        console.log(req.body);
        const vendorUrl = serviceDetails.vendor.apiUrl
        const merchantID = parseInt(serviceDetails.vendor.optional1)
        const ACCESS_CODE = serviceDetails.vendor.optional2
        const SECURE_SECRET = serviceDetails.vendor.optional3

        const paymentRefId = new Date().valueOf()
        await paymentGatewayOrders.create({
            paymentRefId,
            paymentData: JSON.stringify(req.body)
        })

        //const returnURL = `${req.protocol}://${req.get('host')}/api/v1/pluralGateway/complete`;

        const returnURL = process.env.NODE_ENV == 'staging' ? process.env.STAGING_URL + '/api/v1/pluralGateway/complete' : process.env.PRODUCTION_URL + '/api/v1/pluralGateway/complete'

        const amount = req.body.pgAmount

        const data = {
            "merchant_data": {
                "merchant_id": merchantID,
                "merchant_access_code": ACCESS_CODE,
                "merchant_return_url": returnURL,
                "unique_merchant_txn_id": paymentRefId
            },
            "payment_data": {
                "amount_in_paisa": amount * 100
            },
            "txn_data": {
                "navigation_mode": 2,
                "payment_mode": "1,3,10,11",
                "transaction_type": 1
            },
            "customer_data": {
                "email_id": req.user.email,
                "first_name": req.user.name,
                "customer_id": req.user.id
            },
            "udf_data": {
                "udf_field_1": req.user.id
            }
        }

        //Step 1 convert order data into string after that convert into base64 encoded format 
        const orderJson = JSON.stringify(data);
        const base64EncodedOrder = Buffer.from(orderJson).toString('base64');

        // this function will mix both base64 and secure key to generate hash (x-verify token)
        function validateSecureIncomingRequest(request, secureSecret) {
            let shaGenerated = "";
            let shaObj = new jsSHA("SHA-256", "TEXT");
            shaObj.setHMACKey(secureSecret, "HEX");
            shaObj.update(request);
            shaGenerated = shaObj.getHMAC("HEX").toUpperCase();
            return shaGenerated;
        }
        const xVerifyToken = validateSecureIncomingRequest(base64EncodedOrder, SECURE_SECRET)

        let config = {
            method: 'post',
            url: `${vendorUrl}/api/v2/accept/payment`,
            headers: {
                'Content-Type': 'application/json',
                'cache-control': 'no-cache',
                'x-verify': xVerifyToken
            },
            data: {
                "request": base64EncodedOrder
            }
        };
        await axios.request(config).then((response) => {
            console.log(response.data);
            if (response.data.response_code == 1) {
                return res.status(201).json({
                    status: true,
                    redirectLink: response.data.redirect_url
                });
            } else {
                return next(new ErrorResponse('Something went wrong while creating order', 501))
            }
        }).catch((err) => {
            console.log(err.response);
            return next(new ErrorResponse('Something went wrong while creating order', 501))
        })
    } catch (err) {
        console.log(err);
        return next(new ErrorResponse('Something went wrong while creating order', 501))
    }
})

/* F-PAY-32: unused/unrouted Plural status check (no callers) — commented out, not removed.
exports.checkPaymentGatewayStatus = asyncHandler(async (req, paymentGatewayResponse) => {
    try {
        const credentialId = req.user.id
        const packageId = req.user.packageId
        const serviceDetails = await fetchServiceDetails({
            credentialId,
            accessKey,
            packageId
        })
        if (serviceDetails.hasOwnProperty('error')) {
            throw new ErrorResponse(serviceDetails['error'], 200);
        }
        const vendorUrl = serviceDetails.vendor.apiUrl
        const accessCode = serviceDetails.vendor.optional2
        const SECURE_SECRET = serviceDetails.vendor.optional3
        const { merchant_id, unique_merchant_txn_id } = paymentGatewayResponse

        const textToHash = `ppc_MerchantAccessCode=${accessCode}&ppc_MerchantID=${merchant_id}&ppc_TransactionType=3&ppc_UniqueMerchantTxnID=${unique_merchant_txn_id}`

        // Create the DIA secret using the request parameters passed to the API, excluding ppc_DIA_SECRET_TYPE and ppc_DIA_SECRET.
        const hash = generateHash(textToHash, SECURE_SECRET);

        let formData = new URLSearchParams();
        formData.append('ppc_MerchantAccessCode', accessCode);
        formData.append('ppc_MerchantID', merchant_id);
        formData.append('ppc_TransactionType', '3'); // 3 for inquiry, 10 for refund
        formData.append('ppc_UniqueMerchantTxnID', unique_merchant_txn_id);
        formData.append('ppc_DIA_SECRET_TYPE', 'SHA256');
        formData.append('ppc_DIA_SECRET', hash);

        const config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: `${vendorUrl}/api/PG/V2`,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: formData
        };

        const response = await axios.request(config)
        console.log('successfully get response from status check api ...............................................');
        console.log(response?.data);
        return response?.data
    } catch (error) {
        console.log(error);
        throw error;
    }
})
*/

// used to create hash (dia secert need pass to the plural api)
function generateHash(input, strSecretKey) {
    let strHash = '';
    try {
        if (!isValidString(input) || !isValidString(strSecretKey)) {
            return strHash;
        }
        const convertedHashKey = Buffer.from(strSecretKey, 'hex');
        const key = crypto.createHmac('sha256', convertedHashKey);
        key.update(input, 'utf-8');
        strHash = key.digest('hex');
    } catch (ex) {
        strHash = '';
    }
    return strHash.toUpperCase();
}
function isValidString(str) {
    return str !== null && str.trim() !== '';
}


exports.refundGatewayTransaction = asyncHandler(async (req, paymentGatewayResponse) => {
    try {
        const credentialId = req.user.id
        const packageId = req.user.packageId
        const serviceDetails = await fetchServiceDetails({
            credentialId,
            accessKey,
            packageId
        })
        if (serviceDetails.hasOwnProperty('error')) {
            return { state: serviceDetails['error'] }
        }

        const vendorUrl = serviceDetails.vendor.apiUrl
        const accessCode = serviceDetails.vendor.optional2
        const SECURE_SECRET = serviceDetails.vendor.optional3
        const { merchant_id, pine_pg_transaction_id, amount_in_paisa } = paymentGatewayResponse
        const uniqueTxnId = new Date().valueOf()

        const textToHash = `ppc_Amount=${amount_in_paisa}&ppc_CurrencyCode=356&ppc_MerchantAccessCode=${accessCode}&ppc_MerchantID=${merchant_id}&ppc_PinePGTransactionID=${pine_pg_transaction_id}&ppc_TransactionType=10&ppc_UniqueMerchantTxnID=${uniqueTxnId}`

        // Create the DIA secret using the request parameters passed to the API, excluding ppc_DIA_SECRET_TYPE and ppc_DIA_SECRET.
        const hash = generateHash(textToHash, SECURE_SECRET);
        console.log(hash);

        let formData = new URLSearchParams();
        formData.append('ppc_MerchantAccessCode', accessCode);
        formData.append('ppc_MerchantID', merchant_id);
        formData.append('ppc_UniqueMerchantTxnID', uniqueTxnId);
        formData.append('ppc_PinePGTransactionID', pine_pg_transaction_id);
        formData.append('ppc_Amount', amount_in_paisa);
        formData.append('ppc_CurrencyCode', '356'); //for INR
        formData.append('ppc_TransactionType', '10'); //10 for refund , 3 for inquiry
        formData.append('ppc_DIA_SECRET_TYPE', 'SHA256');
        formData.append('ppc_DIA_SECRET', hash);

        let config = {
            method: 'post',
            url: `${vendorUrl}/api/PG/V2`,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: formData
        };

        const response = await axios.request(config)
            .then((response) => {
                console.log('****************');
                console.log(response.data);
                return response.data
            }).catch((e) => {
                console.log(e.response);
                return e.response?.data?.ppc_TxnResponseMessage
            })
        return response
    } catch (error) {
        console.log(error);
        return { state: error }
    }
})
