const express = require('express');
const {
    dispatchCorporateCardAgreement,
    getCorporateCardAgreementStatus,
} = require('../../../../controllers/corporate/corporateCardESign');
const { customLog } = require('../../../../utils/loggerHelper');
const constantTimeEqual = require('../../../../utils/constantTimeEqual');

const router = express.Router({ mergeParams: true });

const CORPORATE_CARD_WEBHOOK_USER = 'corporatecard';

const deny = (res, responseCode) =>
    res.status(401).json({ status: false, message: 'Unauthorized', data: {}, responseCode });

const verifyDispatchSecret = (req, res, next) => {
    const expected = process.env.ESIGN_DISPATCH_SECRET;
    if (!expected) {
        customLog(req?.LogTraceId, 'error', {
            message: '[CorporateCardESign] ESIGN_DISPATCH_SECRET is not configured — refusing the call',
            path: req.originalUrl,
        });
        return res.status(503).json({
            status: false,
            message: 'Service unavailable',
            data: {},
            responseCode: '001',
        });
    }

    if (req.params.webhookUser !== CORPORATE_CARD_WEBHOOK_USER) {
        customLog(req?.LogTraceId, 'error', {
            message: '[CorporateCardESign] Unexpected webhookUser',
            webhookUser: req.params.webhookUser,
        });
        return deny(res, '002');
    }

    if (!constantTimeEqual(req.headers['x-esign-dispatch-secret'], expected)) {
        customLog(req?.LogTraceId, 'error', {
            message: '[CorporateCardESign] Dispatch secret mismatch',
            path: req.originalUrl,
        });
        return deny(res, '002');
    }

    return next();
};

router.use(verifyDispatchSecret);
router.post('/dispatch', dispatchCorporateCardAgreement);
router.get('/status', getCorporateCardAgreementStatus);

module.exports = router;
module.exports.verifyDispatchSecret = verifyDispatchSecret;
