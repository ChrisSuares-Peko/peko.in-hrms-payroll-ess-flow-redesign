const { Op, Sequelize } = require("sequelize");
const asyncHandler = require("../../middlewares/async");
const setting = require("../entities/setting");

exports.getGstDetails = asyncHandler(async () => {
  return await setting.findOne({
    where: {name: "taxRate"},
  });
});

// An internal account is one of the credential ids on the Internal Accounts list. Anything unreadable counts as not internal.
exports.isInternalAccount = async (credentialId) => {
  const idNum = Number(credentialId);
  if (credentialId === null || credentialId === undefined || Number.isNaN(idNum)) return false;
  try {
    const row = await setting.findOne({
      where: {
        name: "internalAccounts",
        [Op.and]: Sequelize.literal(`JSON_CONTAINS(details, CAST(${idNum} AS JSON))`),
      },
    });
    return !!row;
  } catch (error) {
    return false;
  }
};
