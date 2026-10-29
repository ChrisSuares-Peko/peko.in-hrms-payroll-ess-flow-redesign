/* eslint-disable no-unused-vars */
const corporateUser = require("./../entities/corporateUser");
const asyncHandler = require("./../../middlewares/async");
const { authenticator } = require("otplib");

// Verify TOTP token
exports.authVerification = asyncHandler(async (userId, token) => {
  const user = await corporateUser.findOne({
    where: {
      credentialId: userId,
    },
  });
  if (!user) {
    return false;
  } 
  const totpSecret = user.totpSecret;
   if (!totpSecret) {
    return false;
  } else {
    const valid = authenticator.check(token, totpSecret);
    if (valid) {
      return {
        valid: true,
      };
    } else {
      return false;
    }
  }
});
