const systemUser = require('./../entities/systemUser')
const asyncHandler = require('./../../middlewares/async')
const partnerLogos = require("../../public/partnerLogos")

exports.fetchPartnerDetails = asyncHandler(async (credentialId) => {
    let result = null;
    if (credentialId) {
        try {
            result = await systemUser.findOne({
                where: {
                    credentialId
                },
                attributes: ['assets', 'branding', 'sharePercentage', 'gatewayCharge', 'state'],
                nest: true,
                raw: true
            });
        } catch (error) {
            console.error("partner branding lookup failed, using defaults:", error);
        }
    }

    return {
        logo: result?.assets?.logo || partnerLogos[0]?.logo,
        baseUrl: result?.assets?.baseUrl || partnerLogos[0]?.baseUrl,
        branding: result?.branding || partnerLogos[0]?.branding,
        sharePercentage: result?.sharePercentage,
        gatewayCharge: result?.gatewayCharge,
        state: result?.state,
    };
})