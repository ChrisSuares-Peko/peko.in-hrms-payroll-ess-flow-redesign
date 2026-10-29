/* eslint-disable no-unused-vars */
const signUp = require("./../entities/signUp");
const Package = require("./../entities/package");
const sequelize = require("../../configs/database/index");
const { Op } = require("sequelize");
const corporateUser = require("./../entities/corporateUser");
const credential = require("./../entities/credential");
const asyncHandler = require("./../../middlewares/async");
const wallet = require("../entities/wallet");
const { passwordCreatedSuccessfullyTemplate, accountCreatedSuccessTemplate } = require("../../utils/templatesForEmails");
const emailer = require("../../utils/emailer");
const crypto = require("crypto");
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




