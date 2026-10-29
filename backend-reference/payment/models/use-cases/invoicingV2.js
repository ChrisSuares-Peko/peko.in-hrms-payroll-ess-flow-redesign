"use strict";
const invoicingV2 = require("../entities/invoicingV2");

const findInvoiceById = async ({ id }) => {
  return invoicingV2.findOne({ where: { id } });
};

module.exports = { findInvoiceById };
