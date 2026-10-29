const { getGstDetails } = require("../models/use-cases/setting");
const { amountPrecision } = require("../utils/formatter");
const { customLog } = require("../utils/loggerHelper");

exports.calculateAmountAndTax = (amount, taxRate) => {
  const amountNum = parseFloat(amount);
  const taxRateNum = parseFloat(taxRate);

  if (isNaN(amountNum) || isNaN(taxRateNum)) {
    return {
      error:
        "Invalid input. Please provide valid numbers for amount and tax rate.",
    };
  }

  const actualAmount = amountNum / (1 + taxRateNum);
  const taxAmount = amountNum - actualAmount;

  return {
    actualAmount: amountPrecision(actualAmount),
    taxAmount: amountPrecision(taxAmount),
  };
};

exports.calculateAmountWithTax = async (amount) => {
  if (amount <= 0) {
    return amount;
  }
  const data = await getGstDetails();
  if (!data) {
    customLog(null, "error", "GST and TAX calculation: Tax rate not found");
    return amount;
  }
  const taxRate = parseFloat(data?.details?.gst || 18);
  const taxType = data?.details?.type || "PERCENTAGE";

  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || isNaN(taxRate)) {
    customLog(
      null,
      "error",
      "GST and TAX calculation: Invalid amount or tax rate"
    );
    return amount;
  }
  if (taxType === "FLAT") {
    const amountWithTax = amountNum + taxRate;
    return amountPrecision(amountWithTax);
  } else {
    const taxRateDecimal = taxRate / 100;
    const amountWithTax = amountNum * (1 + taxRateDecimal);
    return amountPrecision(amountWithTax);
  }
};
