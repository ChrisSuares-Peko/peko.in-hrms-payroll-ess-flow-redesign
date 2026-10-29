'use strict';

const ErrorResponse = require('../utils/error-response');

const requireCorporateOwner = (message) => (req, res, next) => {
    const user = req.user || {};
    if (user.role === 'CORPORATE' && !user.subCorporateId && user.corporateId) {
        return next();
    }
    return next(new ErrorResponse(message, 403));
};

module.exports = { requireCorporateOwner };
