const Otp = require("../entities/otp");
const { Op } = require("sequelize");
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
  const totpSecret = user.totpSecret;
  if (!user) {
    return false;
  } else if (!totpSecret) {
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

exports.otpVerification = asyncHandler(async (otp, emailOtp, mobileNo) => {
  let otpDetail = await Otp.findOne({
    where: {
      mobile: mobileNo,
      used: 0,
    },
  });
  console.log("V", otpDetail);
  if (!otpDetail) {
    return false;
  }

  if (!(await otpDetail.validatePin(otp))) {
    return false;
  }

  if (!(await otpDetail.validateEmail(emailOtp))) {
    return false;
  }

  const OtpVerified = await Otp.update(
    {
      used: 1,
    },
    {
      where: {
        mobile: mobileNo,
        createdAt: {
          [Op.lte]: new Date(otpDetail.createdAt.getTime() + 20000),
        },
      },
    }
  );

  if (OtpVerified[0] == 1) {
    return true;
  }
  return false;
});
