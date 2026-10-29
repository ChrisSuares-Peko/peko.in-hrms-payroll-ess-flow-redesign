const asyncHandler = require("../../middlewares/async")
const referral_codes = require("../entities/referral_codes")

exports.findOneReferalCode = asyncHandler(async (params) => {
    return await referral_codes.findOne({
        where: {
            referralCode: params,
            status: true
        },
        raw: true,
        nest: true,
    })

})