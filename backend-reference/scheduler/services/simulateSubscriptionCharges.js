// Staging-only: simulates Cashfree's SUBSCRIPTION_PAYMENT_SUCCESS webhook for pending CHARGE orders.

const Sequelize = require("sequelize");
const axios = require("axios");
const sequelizeConfig = require("../configs/database/index");
const { customLog } = require("../utils/loggerHelper");
const { getWhatsAppMerchantClientCreds } = require("../utils/cashfreeProducts");
const { v4: uuidv4 } = require("uuid");
const operatorsData = require("../utils/operatorsData.json");

const ORDER_KIND_SUBSCRIPTION_CHARGE = "SUBSCRIPTION_CHARGE";

// How far back to keep firing the success webhook for an IN_PROGRESS charge. The cron runs once
// daily, so the old 1-day window gave each order a SINGLE shot — an order that missed its one night
// (e.g. WhatsApp merchant creds momentarily unresolved, a job error, or a deploy gap) fell outside
// the window and was orphaned IN_PROGRESS forever, with no automated recovery. 7 days spans the full
// renewal lifecycle (charge fires ~endDate-2, base plan force-expires ~endDate+3) and gives each
// order daily retries. Idempotent by construction: a resolved order is COMPLETE/FAILED, not
// IN_PROGRESS, so it drops out of the query on the next run.
const SIMULATE_LOOKBACK_DAYS = 7;

const getCashfreeCredentials = async () => {
  const rows = await sequelizeConfig.query(
    `SELECT v.apiUrl, v.optional1 AS clientId, v.optional2 AS clientSecret, v.optional3 AS apiVersion
       FROM serviceOperators so
       JOIN vendors v ON so.vendorId = v.id
      WHERE so.accessKey = '${operatorsData["cashfreeSubscriptions"]["accessKey"]}'
      LIMIT 1`,
    { type: Sequelize.QueryTypes.SELECT }
  );
  return rows[0] ?? null;
};

const buildSimulateUrl = (apiUrl) => {
  const base = String(apiUrl || "").replace(/\/$/, "");
  return base.endsWith("/pg") ? `${base}/simulate` : `${base}/pg/simulate`;
};

const callSimulate = async (credentials, paymentId, status = "SUCCESS") => {
  const url = buildSimulateUrl(credentials.apiUrl);
  return axios({
    method: "POST",
    url,
    headers: {
      "Content-Type": "application/json",
      "x-api-version": credentials.apiVersion || "2023-08-01",
      "x-client-id": credentials.clientId,
      "x-client-secret": credentials.clientSecret,
    },
    data: {
      entity: "SUBS_PAYMENTS",
      entity_id: paymentId,
      entity_simulation: { payment_status: status },
    },
    timeout: 30000,
  });
};

exports.simulateSubscriptionCharges = async () => {
  // One correlation id per cron run, threaded through every customLog in this job.
  const traceId = uuidv4();
  if (process.env.NODE_ENV !== "staging") {
    customLog(traceId, "info", {
      message: "simulateSubscriptionCharges skipped (only runs when NODE_ENV=staging)",
      nodeEnv: process.env.NODE_ENV,
    });
    return { skipped: true };
  }

  let credentials;
  try {
    credentials = await getCashfreeCredentials();
  } catch (err) {
    customLog(traceId, "error", { message: "simulateSubscriptionCharges: credential lookup failed", error: err?.message });
    return { skipped: true, error: err?.message };
  }
  if (!credentials) {
    customLog(traceId, "error", { message: "simulateSubscriptionCharges: Cashfree credentials not configured" });
    return { skipped: true };
  }

  let pending;
  try {
    pending = await sequelizeConfig.query(
      `SELECT id, referenceNo, paymentRefId, vendorSubscriptionId
         FROM paymentGatewayOrders
        WHERE orderKind = :orderKind
          AND status = 'IN_PROGRESS'
          AND createdAt >= DATE_SUB(NOW(), INTERVAL ${SIMULATE_LOOKBACK_DAYS} DAY)`,
      {
        replacements: { orderKind: ORDER_KIND_SUBSCRIPTION_CHARGE },
        type: Sequelize.QueryTypes.SELECT,
      }
    );
  } catch (err) {
    customLog(traceId, "error", { message: "simulateSubscriptionCharges: query failed", error: err?.message });
    return { error: err?.message };
  }

  if (!pending || pending.length === 0) {
    return { success: 0, failed: 0, total: 0 };
  }

  let success = 0;
  let failed = 0;
  let skippedForWaCreds = 0;
  let waCreds = null; // lazily resolved; WhatsApp charge orders simulate on the WhatsApp merchant
  for (const order of pending) {
    const paymentId = order.referenceNo;
    try {
      // WhatsApp charge orders (referenceNo `wa_charge_...`) live on the WhatsApp merchant — simulate
      // with its clientId/secret; apiUrl + version stay the shared connection. Peko orders use base creds.
      let orderCreds = credentials;
      if (String(paymentId || "").startsWith("wa_charge_")) {
        if (!waCreds) waCreds = await getWhatsAppMerchantClientCreds();
        if (!waCreds?.clientId || !waCreds?.clientSecret) {
          // Every WhatsApp charge order is dropped when its merchant creds don't resolve — this is
          // exactly how a wa_charge_* order gets orphaned IN_PROGRESS with no renewal webhook. Log
          // loudly, per order, with the identifiers a tester needs to re-simulate it manually.
          skippedForWaCreds++;
          failed++;
          customLog(traceId, "error", {
            message: "simulateSubscriptionCharges: WhatsApp merchant Cashfree credentials not resolved — WhatsApp charge NOT simulated, order left IN_PROGRESS. Fix the WhatsApp merchant creds, or re-simulate this order manually via the admin simulate endpoint.",
            paymentId,
            vendorSubscriptionId: order.vendorSubscriptionId,
          });
          continue;
        }
        orderCreds = { ...credentials, clientId: waCreds.clientId, clientSecret: waCreds.clientSecret };
      }
      const resp = await callSimulate(orderCreds, paymentId, "SUCCESS");
      customLog(traceId, "info", {
        message: "Cashfree CHARGE simulate succeeded",
        paymentId,
        cashfreeStatus: resp?.data?.status,
        chargeResponse: resp?.data?.chargeResponse,
      });
      success++;
    } catch (err) {
      customLog(traceId, "error", {
        message: "Cashfree CHARGE simulate failed",
        paymentId,
        error: err?.response?.data ?? err?.message,
      });
      failed++;
    }
  }

  customLog(traceId, "info", {
    message: "simulateSubscriptionCharges complete",
    total: pending.length,
    success,
    failed,
    skippedForWaCreds,
  });
  return { success, failed, skippedForWaCreds, total: pending.length };
};

exports.callSimulate = callSimulate;
exports.buildSimulateUrl = buildSimulateUrl;
exports.getCashfreeCredentials = getCashfreeCredentials;
