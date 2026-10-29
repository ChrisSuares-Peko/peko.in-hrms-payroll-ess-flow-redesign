const { Op, Sequelize } = require("sequelize");
const asyncHandler = require("../../middlewares/async")
const setting = require("../entities/setting");


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

  exports.getShipmentCancelInformMails = asyncHandler(async (attributes = undefined) => {
  return await setting.findOne({
    where: {name: "shipmentCancelInformMails"},
    attributes
  });
});

// Live FX rates refreshed every 3h by the scheduler (scheduler/services/currencyExchange.js,
// currencyapi.com with base_currency=INR). Shape: { USD: { code: "USD", value: 0.0119 }, ... }
// where `value` = units of that currency per 1 INR. Returns null when unavailable.
exports.getCurrencyExchangeRates = async () => {
  try {
    const row = await setting.findOne({ where: { name: "currencyExchangeRate" }, raw: true });
    const details = typeof row?.details === "string" ? JSON.parse(row.details) : row?.details;
    return details && typeof details === "object" ? details : null;
  } catch (error) {
    return null;
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
