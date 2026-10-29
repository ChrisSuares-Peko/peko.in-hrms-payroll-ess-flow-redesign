const { findAllActivePrivacyPolicies } = require('../../models/use-cases/privacyPolicyDetails');
const { findOneCredential } = require('../../models/use-cases/credential');
const asyncHandler = require('../../middlewares/async');

const parseBoolEnv = (value) => {
    if (typeof value !== 'string') return false;
    return ['true', '1'].includes(value.trim().toLowerCase());
};

exports.getAllPrivacyPolicyDetails = asyncHandler(async (_req, res) => {
    const policies = await findAllActivePrivacyPolicies();

    return res.status(200).json({
        status: true,
        message: 'Privacy policies fetched successfully',
        responseCode: '000',
        data: policies
    });
});

exports.getPrivacyPolicyEnforcement = asyncHandler(async (req, res) => {
    const partnerId = req.query?.partnerId ? Number(req.query.partnerId) : null;

    let enforcePrivacyPolicy;

    if (partnerId) {
        const partnerCredential = await findOneCredential(
            { id: partnerId },
            ['id', 'role', 'enforcePrivacyPolicy']
        );

        if (!partnerCredential) {
            enforcePrivacyPolicy = parseBoolEnv(process.env.ENFORCE_PRIVACY_POLICY);
        } else {
            enforcePrivacyPolicy = !!partnerCredential?.enforcePrivacyPolicy;
        }
    } else {
        enforcePrivacyPolicy = parseBoolEnv(process.env.ENFORCE_PRIVACY_POLICY);
    }

    return res.status(200).json({
        status: true,
        message: 'Privacy policy enforcement fetched successfully',
        responseCode: '000',
        data: { enforcePrivacyPolicy }
    });
});
