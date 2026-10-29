const axios = require('axios');
const withRetry = require('../withRetry');
const { customLog } = require('../loggerHelper');

const REQUEST_TIMEOUT_MS = 15000;
const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 2000;
const MASK_FIELDS = ['X-API-Key', 'x-api-key', 'Authorization', 'authorization'];

module.exports = ({ label, url, headers, params, traceId }) => {
    customLog(traceId, 'info', { message: `[packageSync:${label}] request`, url, params: params || null }, 'VENDOR');
    return withRetry(async () => {
        try {
            const response = await axios({ method: 'get', url, params, headers, timeout: REQUEST_TIMEOUT_MS });
            customLog(
                traceId,
                'info',
                { message: `[packageSync:${label}] response`, url, status: response.status, response: response.data },
                'VENDOR',
                MASK_FIELDS
            );
            return response.data;
        } catch (err) {
            customLog(
                traceId,
                'error',
                {
                    message: `[packageSync:${label}] error`,
                    url,
                    status: err?.response?.status || null,
                    response: err?.response?.data || err.message,
                },
                'VENDOR',
                MASK_FIELDS
            );
            throw err;
        }
    }, MAX_ATTEMPTS, BASE_DELAY_MS);
};
