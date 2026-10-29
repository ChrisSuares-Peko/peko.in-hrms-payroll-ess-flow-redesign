"use strict";
const { CORPORATE_CARD_GATEWAY, CORPORATE_CARD_PAYMENT_MODE } = require("../constants/corporateCardPayment");

// orders.paymentMode families. A corporate card payment is gateway-shaped money (moved before the service ran,
// refunded through cancelPGTransaction), so every refund branch that treats PAYMENT GATEWAY one way and WALLET
// another must treat CORPORATE CARD like the gateway.
const isGatewayPaid = (paymentMode) => {
  const mode = String(paymentMode || "").toUpperCase();
  return mode.startsWith("PAYMENT GATEWAY") || mode.startsWith(CORPORATE_CARD_PAYMENT_MODE);
};

const isSplitWithWallet = (paymentMode) => String(paymentMode || "").toUpperCase().endsWith("+ WALLET");

// The gateway response carried on req.body for a corporate card payment: a one-element array like Cashfree's,
// whose element carries our marker.
const corporateCardReceipt = (paymentGatewayResponse) => {
  const first = Array.isArray(paymentGatewayResponse) ? paymentGatewayResponse[0] : paymentGatewayResponse;
  return first && typeof first === "object" && first.gateway === CORPORATE_CARD_GATEWAY ? first : null;
};

// Label for an order row written by a service that builds its own instead of going through createPGTransaction.
const gatewayModeLabel = (paymentGatewayResponse, splitWithWallet = false) => {
  const base = corporateCardReceipt(paymentGatewayResponse) ? CORPORATE_CARD_PAYMENT_MODE : "PAYMENT GATEWAY";
  return splitWithWallet ? `${base} + WALLET` : base;
};

module.exports = { isGatewayPaid, isSplitWithWallet, corporateCardReceipt, gatewayModeLabel };
