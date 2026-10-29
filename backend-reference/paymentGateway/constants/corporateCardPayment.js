'use strict';

// The corporate card leg: a Pine Labs SVA redeem made through corporateCard, then replayed into the service
// handlers exactly as a Cashfree payment is.
module.exports = {
  // Marker on paymentGatewayResponse and orders.paymentModeResponse; cancelPGTransaction branches on it.
  CORPORATE_CARD_GATEWAY: 'CORPORATE_CARD',
  // orders.paymentMode label, alongside 'WALLET' and 'PAYMENT GATEWAY'.
  CORPORATE_CARD_PAYMENT_MODE: 'CORPORATE CARD',
  // payment_methods.paymentMethod ENUM value (partner-level enablement).
  CORPORATE_CARD_PAYMENT_METHOD: 'CORPORATE_CARD',
  // corporateCard in-app row states we act on here.
  IN_APP_STATUS: { REDEEMED: 'REDEEMED', DECLINED: 'DECLINED', FAILED: 'FAILED', TIMEOUT: 'TIMEOUT' },
};
