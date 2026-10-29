const { Op, Sequelize } = require("sequelize");
const asyncHandler = require("../../middlewares/async");
const { customLog } = require("../../utils/loggerHelper");
const setting = require("../entities/setting");

exports.getGstDetails = asyncHandler(async () => {
  return await setting.findOne({
    where: {name: "taxRate"},
  });
});

exports.getGstDetails = asyncHandler(async () => {
  return await setting.findOne({
    where: {name: "taxRate"},
  });
});
exports.findByName = asyncHandler(async (params) => {
  return await setting.findOne({
      where: {
          name: params.name
      }
  })
})

exports.getPGChargeDetails = asyncHandler(async (dynamicId) => {
  const pgCharges = await setting.findOne({
    where: {name: "PG_Charges"},
  });
  let chargesData={}
  if(pgCharges?.details?.length){
    chargesData = pgCharges.details.find(option => option?.key == dynamicId);
  }
  return chargesData || {}
});

exports.getCurrencyExchangeRate = async () => {
  try {
    const settingRecord = await setting.findOne({
      where: { name: "currencyExchangeRate" },
    });
    return settingRecord?.details || {};
  } catch (error) {
    customLog(null, "error", { message: `Error fetching data from settings table`, dbQuery: { name: "currencyExchangeRate" } });
    return false;
  }
};

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
