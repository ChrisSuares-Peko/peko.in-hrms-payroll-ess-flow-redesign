const { findServiceOperatorByAccessKey } = require("./checkAndFetchServiceDetails");
const operatorsData = require("./operatorsData.json");

const SHARED_ACCESS_KEY = operatorsData["cashFreePaymentGateway"]["accessKey"];
// ONDC (Office Supplies) captures on its own Cashfree merchant — the same one
// Easy Split pays the sellers from.
const ONDC_ACCESS_KEY = operatorsData["cashFreeOndc"]["accessKey"];

/** A service operator row is only usable as a merchant if it yields BOTH creds. */
const hasCashfreeCredentials = (row) =>
  Boolean(
    (row?.paymentclientid || row?.vendor?.optional1) &&
      (row?.paymentclientsecret || row?.vendor?.optional2)
  );

/**
 * Load the `cashfree_ondc` operator row for an ONDC payment — or null when it is
 * absent or has no credentials, in which case the caller falls back to the shared
 * cascade. All-or-nothing on purpose: partially using this row (e.g. its apiUrl
 * with another row's client id) would point at the wrong merchant.
 */
const loadOndcCashfreeOperator = async (isOndc) => {
  if (!isOndc) return null;
  const found = await findServiceOperatorByAccessKey(ONDC_ACCESS_KEY);
  if (!found || Object.prototype.hasOwnProperty.call(found, "error")) return null;
  return hasCashfreeCredentials(found) ? found : null;
};

/**
 * Pick the Cashfree merchant credentials for ONE payment from already-loaded
 * service operator rows.
 *
 * This MUST return the same merchant for a given payment at create-order time and
 * again at /complete: a Cashfree order exists only on the merchant it was created
 * against, so an asymmetric resolution makes the payments lookup 404, throws, and
 * surfaces to the buyer as a 500 "Payment failed" — after their money has already
 * left. That is why all three call sites (createOrder, handlePGCallback,
 * handlePendingTransactions) go through here instead of inlining the cascade.
 *
 * ONDC (Office Supplies) runs on its own merchant (`cashfree_ondc`, the one Easy
 * Split pays sellers from). Everything else keeps the historical cascade: the
 * paying service's own paymentclientid/paymentclientsecret, else the shared
 * `cashfree_pg` vendor row.
 */
const pickCashfreeCredentials = ({ shared, individual = null, ondc = null }) => {
  if (ondc) {
    return {
      clientId: ondc.paymentclientid || ondc.vendor?.optional1,
      clientSecret: ondc.paymentclientsecret || ondc.vendor?.optional2,
      baseUrl: ondc.vendor?.apiUrl || shared.vendor.apiUrl,
      version: ondc.vendor?.optional3 || shared.vendor.optional3,
      merchant: ONDC_ACCESS_KEY,
    };
  }
  return {
    clientId: individual?.paymentclientid ?? shared.vendor.optional1,
    clientSecret: individual?.paymentclientsecret ?? shared.vendor.optional2,
    baseUrl: shared.vendor.apiUrl,
    version: shared.vendor.optional3,
    merchant: individual?.paymentclientid ? individual.accessKey || "service" : SHARED_ACCESS_KEY,
  };
};

module.exports = {
  SHARED_ACCESS_KEY,
  ONDC_ACCESS_KEY,
  hasCashfreeCredentials,
  loadOndcCashfreeOperator,
  pickCashfreeCredentials,
};
