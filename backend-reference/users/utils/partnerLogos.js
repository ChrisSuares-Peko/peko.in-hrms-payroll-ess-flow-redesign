const partnerLogos = require("../public/partnerLogos");
const ErrorResponse = require("./error-response");

exports.partnerLogos = async () => {
    try {
        const logoData = partnerLogos[0];

        return {
            logo: logoData?.logo,
            branding: logoData?.branding,
            baseUrl: logoData?.baseUrl,
            signUpImage:logoData.signUpImage,
            state:logoData.state,
        };

    } catch (error) {
        return new ErrorResponse("something went wrong while fetching logo")
    }
}