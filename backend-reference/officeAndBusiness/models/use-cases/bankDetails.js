const asyncHandler = require("./../../middlewares/async");
const bankDetails = require("./../entities/bankDetails");

exports.findOneBankAccount = asyncHandler(async (params) => {
  return await bankDetails.findOne({
    where: {
      credentialId: params.corporateId,
      default: true,
    },
    nest: true,
    raw: true,
  });
});

exports.findDefaultBankAccount = asyncHandler(async (params) => {
  return await bankDetails.findOne({
    where: {
      credentialId: params.id,
      default: true,
      status: true,
    },
    nest: true,
    raw: true,
  });
});
