'use strict';
const { fetchPartnerDetails } = require('../../models/use-cases/systemUser');
const { customLog } = require('../../utils/loggerHelper');

// Cross-service partner-branding lookup for Mongo-backed services (e.g. payroll)
// that can't query the systemUsers table directly. Always resolves - fetchPartnerDetails
// itself falls back to Peko's own default branding when there's no partner/credentialId,
// so this endpoint can never be the reason an email fails to send.
exports.resolvePartnerDetailsForService = async (req, res) => {
    try {
        const { credentialId } = req.body || {};

        const partnerDetails = await fetchPartnerDetails(credentialId || null);

        return res.status(200).json({ status: true, message: 'Success', data: partnerDetails });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', {
            message: 'Partner details resolve endpoint failed',
            error: error?.message,
        });
        return res.status(500).json({ status: false, message: 'Something went wrong', data: {} });
    }
};
