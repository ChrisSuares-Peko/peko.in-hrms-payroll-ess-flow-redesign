"use strict";
const invoiceSettingsV2 = require("../entities/invoiceSettingsV2");

const findInvoiceSettingsByCorporateUserId = async ({ corporateUserId }) => {
  return invoiceSettingsV2.findOne({ where: { corporateUserId } });
};

module.exports = { findInvoiceSettingsByCorporateUserId };
