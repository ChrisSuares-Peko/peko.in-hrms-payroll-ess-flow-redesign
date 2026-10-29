const { calculateTaxBreakdown } = require("../services/GSTandTAXcalculation");

const NOT_PURCHASABLE_MESSAGE = "Extra physical cards are not available on your plan.";

const resolveQuantity = (raw) => {
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
};

/**
 * Price of extra physical cards, taxed the same way as a plan purchase.
 *
 * `unitPrice` on the plan's corporate_cards row is the pre-GST base. GST is added on top with the shared
 * subscription calculator, so the preview, the pre-order validator and the completion handler all agree
 * on one number — and none of them ever trusts an amount from the client.
 */
const calculatePhysicalCardPrice = async ({ serviceDetails, quantity }) => {
  const unitPrice = Number(serviceDetails?.unitPrice);
  if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
    return { error: NOT_PURCHASABLE_MESSAGE };
  }
  const qty = resolveQuantity(quantity);
  const tax = await calculateTaxBreakdown(unitPrice * qty);
  return {
    unitPrice,
    quantity: qty,
    taxableAmount: tax.taxableAmount,
    taxAmount: tax.taxAmount,
    taxRate: tax.taxRate,
    expectedPaymentAmount: tax.grossAmount,
  };
};

module.exports = { calculatePhysicalCardPrice, NOT_PURCHASABLE_MESSAGE };
