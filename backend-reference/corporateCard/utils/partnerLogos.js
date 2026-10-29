const partnerLogos = require("../public/partnerLogos");
const ErrorResponse = require("./error-response");

exports.partnerLogos = async () => {
    try {
        const logoData = partnerLogos[0];

        const envBaseUrl =
            process.env.NODE_ENV === 'production'
                ? process.env.FRONTEND_PRODUCTION_URL
                : process.env.FRONTEND_STAGING_URL;

        return {
            logo: logoData?.logo,
            branding: logoData?.branding,
            baseUrl: envBaseUrl || logoData?.baseUrl,
        };

    } catch (error) {
        return new ErrorResponse("something went wrong while fetching logo")
    }
}