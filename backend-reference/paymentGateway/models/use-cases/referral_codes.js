const { customLog } = require("../../utils/loggerHelper");
const ReferralCodes = require("../entities/referral_codes");

exports.getReferralByCode = async (code) => {
  try {
    const referral = await ReferralCodes.findOne({
      where: { referralCode: code },
       raw: true,
      nest: true
    });

    return referral; // returns null if not found
  } catch (error) {
    customLog(null, "error", { 
      message: "Error while fetching referral code:", 
      error 
    });
    return null; // fallback to avoid breaking assignMissingCoupons
  }
};
