const axios = require('axios');
const ErrorResponse = require('../../utils/error-response');
const { fetchVendorDetails } = require('./verifyAccount');

async function fetchCorporateVirtualAccount({ corporateId, headers }) {
    const paymentMsUrl = process.env.PAYMENT_MS_URL || 'http://localhost:4447';
    const url = `${paymentMsUrl}/api/v1/corporate/${corporateId}/payment/payment-links/onboarding/status`;

    try {
        const { data } = await axios.get(url, {
            timeout: 10000,
            headers: {
                Authorization: headers.authorization,
                sessionid: headers.sessionid,
                'x-user-key': headers['x-user-key'],
            },
        });

        if (!data.status || !data.data?.virtualAccountNumber) {
            throw new ErrorResponse('Corporate virtual account not found. Please complete payment link onboarding.', 400);
        }

        return data.data.virtualAccountNumber;
    } catch (err) {
        if (err instanceof ErrorResponse) throw err;
        const message = err.response?.data?.message || err.message || 'Failed to fetch corporate virtual account';
        throw new ErrorResponse(message, err.response?.status || 500);
    }
}

async function getDecentroBeneficiaries({ vendor, query }) {
    const clientId = vendor?.optional2;
    const clientSecret = vendor?.optional3;

    const config = {
        method: 'get',
        url: `${vendor?.apiUrl}/v2/banking/account/beneficiaries`,
        headers: {
            'accept': 'application/json',
            'client_id': clientId,
            'client_secret': clientSecret,
        },
        params: {
            provider_code: query.provider_code,
            sender_account_number: query.sender_account_number,
            beneficiary_code: query.beneficiary_code,
            page: query.page || 1,
        },
    };

    const response = await axios(config);
    return response.data;
}

async function addDecentroBeneficiary({ vendor, payload }) {
    const clientId = vendor?.optional2;
    const clientSecret = vendor?.optional3;

    const config = {
        method: 'post',
        url: `${vendor?.apiUrl}/v2/banking/beneficiary`,
        headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'client_id': clientId,
            'client_secret': clientSecret,
        },
        data: {
            action: 'ADD',
            sender_account_number: payload.sender_account_number,
            account_number: payload.account_number,
            ifsc: payload.ifsc,
            name: payload.name,
            transfer_type: payload.transfer_type,
            sender_mobile: payload.sender_mobile,
        },
    };

    const response = await axios(config);
    return response.data;
}

async function verifyDecentroBeneficiary({ vendor, payload }) {
    const clientId = vendor?.optional2;
    const clientSecret = vendor?.optional3;

    const config = {
        method: 'post',
        url: `${vendor?.apiUrl}/v2/banking/beneficiary`,
        headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'client_id': clientId,
            'client_secret': clientSecret,
        },
        data: {
            action: 'VERIFY',
            beneficiary_code: payload.beneficiary_code,
            sender_account_number: payload.sender_account_number,
        },
    };

    const response = await axios(config);
    return response.data;
}

async function modifyDecentroBeneficiary({ vendor, payload }) {
    const clientId = vendor?.optional2;
    const clientSecret = vendor?.optional3;

    const config = {
        method: 'post',
        url: `${vendor?.apiUrl}/v2/banking/beneficiary`,
        headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'client_id': clientId,
            'client_secret': clientSecret,
        },
        data: {
            action: 'MODIFY',
            beneficiary_code: payload.beneficiary_code,
            sender_account_number: payload.sender_account_number,
        },
    };

    const response = await axios(config);
    return response.data;
}

module.exports = {
    fetchVendorDetails,
    fetchCorporateVirtualAccount,
    getDecentroBeneficiaries,
    addDecentroBeneficiary,
    verifyDecentroBeneficiary,
    modifyDecentroBeneficiary,
};
