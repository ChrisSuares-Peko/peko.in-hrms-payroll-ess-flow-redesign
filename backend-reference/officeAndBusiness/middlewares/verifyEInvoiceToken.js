const { getValue } = require('../utils/cacheDataMethods');
const asyncHandler = require('./async');

exports.verifyEInvoiceToken = asyncHandler(async (req, res, next) => {
    const authToken = req.headers['authtoken'];

    if (!authToken) {
        return res.status(401).json({
            status: false,
            message: 'AuthToken header is required',
            responseCode: '401',
        });
    }

    const cacheKey = `einvoice_auth_${authToken}`;
    const cached = await getValue(cacheKey);

    if (!cached) {
        return res.status(401).json({
            status: false,
            message: 'Your e-Invoice session has expired. Please sign in again to continue.',
            responseCode: '401',
        });
    }

    const authData = JSON.parse(cached);
    req.eInvoiceAuth = authData;

    next();
});
