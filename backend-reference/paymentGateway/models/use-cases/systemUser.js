const asyncHandler = require("../../middlewares/async");
const systemUser = require("../entities/systemUser")
const partnerLogos = require("../../public/partnerLogos")

//function for fetching partner details and assets
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
        signUpImage: result?.assets?.signUpLogo || partnerLogos[0]?.signUpImage,
        sharePercentage: result?.sharePercentage,
        gatewayCharge: result?.gatewayCharge,
        state: result?.state
    };
})