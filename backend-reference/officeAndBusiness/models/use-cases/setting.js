const { Op, Sequelize } = require("sequelize");
const asyncHandler = require("../../middlewares/async");
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

exports.getASetting = async (settingName) => {
    const row = await setting.findOne({ where: { name: settingName } });
    return row ? row.details : false;
};

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

// Used by Global Business Setup pricing conversion (AED → INR). Returns the
// `setting` row whose `details` is a map of currency code → { value: <units
// per 1 INR> }. Consumed by fetchCurrencyRatesMap() in the GBS corporate
// controller; nullish/missing row is handled there.
exports.getCurrencyExchangeRates = asyncHandler(async () => {
  return await setting.findOne({
    where: {name: "currencyExchangeRate"},
    raw: true,
    nest: true,
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
