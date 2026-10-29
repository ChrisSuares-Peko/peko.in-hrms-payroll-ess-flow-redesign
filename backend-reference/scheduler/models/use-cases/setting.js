const { Op, Sequelize } = require("sequelize");
const asyncHandler = require("../../middlewares/async");
const { customLog } = require("../../utils/loggerHelper");
const setting = require("../entities/setting");

exports.getGstDetails = asyncHandler(async () => {
  return await setting.findOne({
    where: {name: "taxRate"},
  });
});

exports.updateCurrencyExchangeRateInDb = async (details) => {
  const name = "currencyExchangeRate";
  try {
    const existing = await setting.findOne({ where: { name } });
    if (existing) {
      existing.details = details;
      existing.changed("details", true);
      await existing.save();
    } else {
      await setting.create({ name, details });
    }
  } catch (error) {
    customLog(null, "error", {
      message: `Error updating data from settings table`,
      dbQuery: { name },
      error,
    });
  }
};

exports.getCurrencyExchangeRate = async () => {
  const name = "currencyExchangeRate";
  try {
    const settingRecord = await setting.findOne({ where: { name } });
    return settingRecord?.details || {};
  } catch (error) {
    customLog(null, "error", {
      message: `Error fetching data from settings table`,
      dbQuery: { name },
    });
    return false;
  }
};

exports.getASetting = async (name) => {
  try {
    const settingRecord = await setting.findOne({ where: { name } });
    return settingRecord?.details ?? null;
  } catch (error) {
    customLog(null, "error", { message: `Error fetching setting from settings table`, dbQuery: { name }, error: error?.message });
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
