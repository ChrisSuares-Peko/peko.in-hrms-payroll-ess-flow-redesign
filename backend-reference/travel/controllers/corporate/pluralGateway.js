/* eslint-disable no-undef */
/* eslint-disable no-prototype-builtins */
const asyncHandler = require('../../middlewares/async')
const axios = require('axios')
const { fetchServiceDetails } = require('../../utils/checkAndFetchServiceDetails')
const crypto = require('crypto');
const accessKey = 'plural_gateway'
const { customLog } = require('../../utils/loggerHelper')


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
                console.log(response.data);
                return response.data
            }).catch((e) => {
                customLog(req?.LogTraceId, "error", { message: e?.message, data: e?.response?.data })
                return e.response?.data?.ppc_TxnResponseMessage
            })
        return response
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
        return { state: error }
    }
})
