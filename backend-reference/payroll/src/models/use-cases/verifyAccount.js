const axios = require('axios');
const ErrorResponse = require('../../utils/error-response');
const { customLog } = require('../../utils/loggerHelper');
const { fetchVendorCredentials } = require('../../utils/credentialsClient');


async function fetchVendorDetails({ corporateId, headers, accessKey = 'vendor_payouts' }) {
    const serverUrl = process.env.SERVER_URL;
    // const serverUrl = 'http://localhost:4444';
    const url = `${serverUrl}/api/v1/corporate/${corporateId}/others/payrollDocs/vendorDetails`;

    const { data } = await axios.post(
        url,
        { accessKey },
        {
            timeout: 10000,
            headers: {
                Authorization: headers.authorization,
                sessionid: headers.sessionid,
                'x-user-key': headers['x-user-key'],
            },
        }
    );

    if (!data.status) {
        throw new ErrorResponse(data.message || 'Failed to fetch vendor credentials', 400);
    }

    return data.data.serviceDetails;
}

const CASHFREE_STATUS_MESSAGES = {
    INVALID_IFSC_FAIL:              'The IFSC code entered is invalid. Please check and re-enter.',
    ACCOUNT_CLOSED:                 'This bank account has been closed. Please provide an active account.',
    ACCOUNT_FROZEN:                 'This bank account is frozen. Please contact your bank.',
    INCORRECT_ACCOUNT_NUMBER:       'The account number is incorrect. Please verify and re-enter.',
    NO_CREDITS_ALLOWED:             'Credits are not allowed to this account. Please provide a different account.',
    NRE_NRO_ACCOUNT:                'NRE/NRO accounts are not supported. Please provide a domestic savings or current account.',
    ACCOUNT_NOT_FOUND:              'No bank account found with the provided details. Please verify the account number and IFSC.',
    TRANSACTION_NOT_ALLOWED:        'Transactions are not allowed on this account. Please provide a different account.',
    INVALID_BENEFICIARY_CREDENTIALS:'The account details provided are invalid. Please re-enter correct details.',
    BENEFICIARY_BANK_OFFLINE:       'The beneficiary bank is currently offline. Please try again later.',
    VERIFICATION_TIMEOUT:           'Verification timed out. Please try again.',
    FAILED:                         'Bank account verification failed. Please check the details and try again.',
};

async function validateCashfreeBankAccount({ payload }) {
    let baseUrl, clientId, clientSecret;

    try {
        const serviceDetails = await fetchVendorCredentials({ accessKey: 'bank_account_verify' });
        baseUrl = serviceDetails.vendor.apiUrl;
        clientId = serviceDetails.vendor.optional1;
        clientSecret = serviceDetails.vendor.optional2;
    } catch (e) {
        customLog(null, 'error', { message: 'Failed to fetch cashfree credentials from DB, falling back to env vars', error: e.message });
        baseUrl = process.env.CASH_FREE_API_URL;
        clientId = process.env.CASHFREE_CLIENT_ID;
        clientSecret = process.env.CASHFREE_CLIENT_SECRET;
    }

    const { beneficiary_details, perform_name_match } = payload;
    const verifyName = !!(perform_name_match && beneficiary_details.name);

    const requestBody = {
        bank_account: beneficiary_details.account_number,
        ifsc: beneficiary_details.ifsc,
        ...(verifyName && { name: beneficiary_details.name }),
    };

    try {
        const response = await axios.post(
            `${baseUrl}/verification/bank-account/sync`,
            requestBody,
            {
                headers: {
                    'content-type': 'application/json',
                    'x-client-id': clientId,
                    'x-client-secret': clientSecret,
                },
            }
        );

        const data = response.data;

        const accountValid = data?.account_status === 'VALID';
        const nameMatchScore = Number(data?.name_match_score ?? 0);
        const nameAtBank = data?.name_at_bank || null;
        const nameMatch = verifyName && nameAtBank
            ? beneficiary_details.name.trim().toLowerCase() === nameAtBank.toLowerCase()
            : null;
        const valid = verifyName ? (accountValid && nameMatch) : accountValid;

        let message;
        if (!accountValid) {
            const code = data?.account_status_code;
            message = (code && CASHFREE_STATUS_MESSAGES[code]) || code || 'Bank account verification failed';
        } else if (verifyName && !nameMatch) {
            message = 'Bank account holder name does not match. Please enter the name exactly as per bank records.';
        } else {
            message = 'Bank account verified successfully';
        }

        return { valid, accountValid, nameMatch, nameAtBank, nameMatchScore, message, response: data };
    } catch (err) {
        customLog(null, 'error', { message: err.message, data: err.response?.data });
        const code = err.response?.data?.code;
        if (code === 'verification_already_under_process') {
            return {
                valid: false,
                accountValid: false,
                nameMatch: null,
                nameAtBank: null,
                nameMatchScore: 0,
                message: 'Bank account verification is already in progress. Please try again in a moment.',
                response: err.response?.data || null,
            };
        }
        return {
            valid: false,
            accountValid: false,
            nameMatch: null,
            nameAtBank: null,
            nameMatchScore: 0,
            message: err.response?.data?.message || err.message || 'Bank account verification failed',
            response: err.response?.data || null,
        };
    }
}

module.exports = { fetchVendorDetails, validateCashfreeBankAccount };
