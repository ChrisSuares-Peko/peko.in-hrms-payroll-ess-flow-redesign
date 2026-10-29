const { default: axios } = require("axios");
const { customLog } = require("../utils/loggerHelper");

/**
 * Trigger the ONDC buyer "delivery delayed" notices in the purchase service.
 *
 * "This order is now late" is not an event anyone sends, so it needs a clock —
 * the same reason ondcTatBreach.js next door exists. The difference is WHO is
 * told: that job alerts the internal team and can therefore run entirely here
 * against the shared DB; this one emails the BUYER, which needs purchase's
 * notification ledger (the send-once claim), its buyer recipient resolver
 * (corporate -> sub-corporate -> billing) and the Office Supplies template set.
 * Duplicating those three here is how templates drift, so this job does nothing
 * itself and calls purchase POST /api/v1/ondc/notify/delayed-orders.
 *
 * The two are deliberately independent: the internal alert claims
 * ondcOrders.tatBreachNotifiedAt, the buyer notice claims "delay:tat-breach" in
 * the ledger. Neither can silence the other, and the internal sweep's
 * "no ops recipients configured -> total no-op" gate does not reach the buyer.
 *
 * The sweep is idempotent, so a retried or overlapping trigger mails nobody twice.
 */

// Same resolution order as the other purchase-internal ONDC jobs.
const PURCHASE_BASE_URL = (
  process.env.PURCHASE_SERVICE_URL ||
  process.env.PURCHASE_MS_URL ||
  "http://localhost:4445"
).replace(/\/+$/, "");

const NOTICE_PATH = "/api/v1/ondc/notify/delayed-orders";

// One SMTP send per late order, so it can legitimately run for a while — but
// bounded, so a wedged request can't pin the job.
const REQUEST_TIMEOUT_MS = 5 * 60 * 1000;

/**
 * Cron entry point. Resolves rather than throws: an unhandled rejection inside a
 * node-schedule callback would take down the scheduler process and every other job
 * registered in scheduleReport.js with it.
 */
exports.triggerOndcBuyerDelayNotices = async () => {
  const url = `${PURCHASE_BASE_URL}${NOTICE_PATH}`;
  const token = process.env.SESSION_SECRET;

  if (!token) {
    // requireInternalToken compares against this same shared secret; without it
    // every call would 401, so fail loudly here instead.
    customLog(null, "error", {
      message: "ONDC buyer delay notices skipped — SESSION_SECRET is not set, the internal call would be rejected",
      url,
    }, "VENDOR");
    return { status: false, error: "missing_session_secret" };
  }

  try {
    customLog(null, "info", { message: "Triggering ONDC buyer delay notices", url }, "VENDOR");

    // Matches DEFAULT_SETTINGS.noEtaFallbackHours in ondcTatBreach.js and
    // purchase's own fallback, so the buyer notice and the internal alert agree
    // about which orders with no declared TAT count as late.
    const response = await axios.post(url, { noEtaFallbackHours: 24 }, {
      timeout: REQUEST_TIMEOUT_MS,
      headers: {
        "Content-Type": "application/json",
        "x-internal-token": token,
      },
    });

    customLog(null, "info", {
      message: "ONDC buyer delay notices complete",
      httpStatus: response?.status ?? null,
      data: response?.data?.data ?? null,
    }, "VENDOR");

    return { status: true, data: response?.data?.data ?? null };
  } catch (error) {
    customLog(null, "error", {
      message: "ONDC buyer delay notices failed",
      url,
      httpStatus: error?.response?.status ?? null,
      responseBody: error?.response?.data ?? null,
      error: error?.message ?? String(error),
    }, "VENDOR");
    return { status: false, error: error?.message ?? String(error) };
  }
};
