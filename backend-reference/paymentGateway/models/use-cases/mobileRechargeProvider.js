const mobileRechargeProvider = require("../entities/mobileRechargeProvider");
const asyncHandler = require("../../middlewares/async");

exports.findByProviderName = asyncHandler(async (providerName) => {
    return await mobileRechargeProvider.findOne({
        where: { providerName },
        raw: true,
    });
});
