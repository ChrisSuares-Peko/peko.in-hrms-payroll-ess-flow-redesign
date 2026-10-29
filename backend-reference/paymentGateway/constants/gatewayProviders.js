'use strict';

const operatorsData = require('../utils/operatorsData.json');

const GATEWAY_PROVIDER = Object.freeze({
  CASHFREE: operatorsData.cashFreePaymentGateway.accessKey,
  CCAVENUE: operatorsData.ccAvenuePaymentGateway.accessKey,
  MSWIPE: operatorsData.mswipePaymentGateway.accessKey,
  RAZORPAY: operatorsData.razorpayPaymentGateway.accessKey,
});

// `code` is what the corporate FE switches on (payment-methods → gateway.provider).
const GATEWAY_PROVIDERS = Object.freeze([
  Object.freeze({ pgProvider: GATEWAY_PROVIDER.CASHFREE, name: 'Cashfree', code: 'CASHFREE' }),
  Object.freeze({ pgProvider: GATEWAY_PROVIDER.CCAVENUE, name: 'CC Avenue', code: 'CCAVENUE' }),
  Object.freeze({ pgProvider: GATEWAY_PROVIDER.MSWIPE, name: 'M Swipe', code: 'MSWIPE' }),
  Object.freeze({ pgProvider: GATEWAY_PROVIDER.RAZORPAY, name: 'Razorpay', code: 'RAZORPAY' }),
]);

const SUPPORTED_GATEWAY_PROVIDERS = Object.freeze(GATEWAY_PROVIDERS.map(({ pgProvider }) => pgProvider));

// BBPS bill payments run on CCAvenue only (commonBillHandler); no payment_methods row moves them.
const isCcAvenueOnlyService = (accessKey) => /^bbps_/.test(String(accessKey || ''));

// A service linked to several gateway rows goes to Razorpay when it is one of them (we are
// migrating onto it), else to the first configured one. No rows → null → FE default (Cashfree).
const pickProviderCode = (providers = [], accessKey = null) => {
  if (isCcAvenueOnlyService(accessKey)) return 'CCAVENUE';
  if (!providers.length) return null;
  const razorpay = providers.find(({ code }) => code === 'RAZORPAY');
  return (razorpay || providers[0]).code;
};

module.exports = {
  GATEWAY_PROVIDER,
  GATEWAY_PROVIDERS,
  SUPPORTED_GATEWAY_PROVIDERS,
  isCcAvenueOnlyService,
  pickProviderCode,
};
