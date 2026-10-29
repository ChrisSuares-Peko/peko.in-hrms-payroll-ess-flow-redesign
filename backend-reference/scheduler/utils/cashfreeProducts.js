'use strict';

const Sequelize = require('sequelize');
const sequelizeConfig = require('../configs/database/index');
const operatorsData = require('./operatorsData.json');

// WhatsApp's own Cashfree merchant lives on its serviceOperator; accessKey always from operatorsData.
const WHATSAPP_ACCESS_KEY = operatorsData['whatsAppForBusiness']['accessKey'];

// WhatsApp's Cashfree clientId/clientSecret come STRICTLY from its own serviceOperator
// (`whatsApp_for_busines` → paymentclientid/paymentclientsecret) — no fallback. Callers keep the
// shared base creds (apiUrl + x-api-version + Peko clientId/secret) from getCashfreeCredentials() and
// replace ONLY clientId/clientSecret with this. Returns { clientId, clientSecret } (each null if unset
// — the caller skips so a WhatsApp charge never runs on the shared merchant).
const getWhatsAppMerchantClientCreds = async () => {
  const [row] = await sequelizeConfig.query(
    `SELECT paymentclientid, paymentclientsecret
     FROM serviceOperators
     WHERE accessKey = :accessKey
     LIMIT 1`,
    { replacements: { accessKey: WHATSAPP_ACCESS_KEY }, type: Sequelize.QueryTypes.SELECT }
  );
  return { clientId: row?.paymentclientid, clientSecret: row?.paymentclientsecret };
};

// Resolve full Cashfree creds for a merchant accessKey. The Cashfree CONNECTION (apiUrl + x-api-version)
// ALWAYS comes from the shared subscriptions vendor — a product's own serviceOperator vendor is the
// service provider (e.g. signDrive for eSign), NOT Cashfree, so its apiUrl must never be used. Only
// clientId/clientSecret vary per product: a product's serviceOperator may carry its own Cashfree
// merchant creds (paymentclientid/secret); otherwise we fall back to the Peko subscriptions merchant.
// Returns merchantSource so callers can customLog which merchant a charge ran on.
const resolveMerchantCredentials = async (accessKey) => {
  const [shared] = await sequelizeConfig.query(
    `SELECT v.apiUrl, v.optional1 AS clientId, v.optional2 AS clientSecret, v.optional3 AS version
     FROM serviceOperators so
     JOIN vendors v ON so.vendorId = v.id
     WHERE so.accessKey = 'cashfree_subscriptions'
     LIMIT 1`,
    { type: Sequelize.QueryTypes.SELECT }
  );
  if (!shared) return null;
  let clientId = shared.clientId;
  let clientSecret = shared.clientSecret;
  let merchantSource = 'cashfree_subscriptions';
  if (accessKey && accessKey !== 'cashfree_subscriptions') {
    const [operator] = await sequelizeConfig.query(
      `SELECT paymentclientid, paymentclientsecret FROM serviceOperators WHERE accessKey = :accessKey LIMIT 1`,
      { replacements: { accessKey }, type: Sequelize.QueryTypes.SELECT }
    );
    if (operator?.paymentclientid && operator?.paymentclientsecret) {
      clientId = operator.paymentclientid;
      clientSecret = operator.paymentclientsecret;
      merchantSource = accessKey;
    }
  }
  return { apiUrl: shared.apiUrl, version: shared.version, clientId, clientSecret, merchantSource };
};

// A Cashfree mandate is merchant-scoped — a subscription MUST renew on the SAME merchant its AUTH
// mandate was created on, never re-resolved from current config. The merchant accessKey is stamped on
// the SUBSCRIPTION_AUTH order's paymentData at purchase; read it back here (defaulting to the shared
// subscriptions merchant for legacy rows / missing data). This lets GROUP + INDIVIDUAL ride one
// scheduler yet each charge on its own merchant.
const getMerchantAccessKeyForSubscription = async (vendorSubscriptionId) => {
  if (!vendorSubscriptionId) return 'cashfree_subscriptions';
  const [row] = await sequelizeConfig.query(
    `SELECT paymentData FROM paymentGatewayOrders
     WHERE vendorSubscriptionId = :vendorSubscriptionId AND orderKind = 'SUBSCRIPTION_AUTH'
     ORDER BY id DESC LIMIT 1`,
    { replacements: { vendorSubscriptionId: String(vendorSubscriptionId) }, type: Sequelize.QueryTypes.SELECT }
  );
  try {
    const accessKey = row?.paymentData ? JSON.parse(row.paymentData)?.accessKey : null;
    return accessKey || 'cashfree_subscriptions';
  } catch {
    return 'cashfree_subscriptions';
  }
};

module.exports = { getWhatsAppMerchantClientCreds, resolveMerchantCredentials, getMerchantAccessKeyForSubscription };
