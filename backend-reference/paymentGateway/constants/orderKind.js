'use strict';

/**
 * paymentGatewayOrders.orderKind — VARCHAR in DB; allowed values for controllers / use-cases.
 * Default row: PAYMENT_GATEWAY (regular /pg/orders, Paytm, Plural, NI, etc.).
 */
const ORDER_KIND = Object.freeze({
  PAYMENT_GATEWAY: 'PAYMENT_GATEWAY',
  SUBSCRIPTION_AUTH: 'SUBSCRIPTION_AUTH',
  SUBSCRIPTION_CHARGE: 'SUBSCRIPTION_CHARGE',
  CORPORATE_CARD: 'CORPORATE_CARD',
});

module.exports = {
  ORDER_KIND,
  DEFAULT_ORDER_KIND: ORDER_KIND.PAYMENT_GATEWAY,
};
