"use strict";

const setting = require("../models/entities/setting");
const { customLog } = require("./loggerHelper");

// Settings key. One row in `settings` with name = SETTING_NAME and details = the JSON below.
// Edit `details` at runtime from admin (no code deploy needed) to tune the windows per env.
const SETTING_NAME = "subscriptionLifecycle";

// Defaults used when the settings row doesn't exist OR a field is missing.
const DEFAULTS = Object.freeze({
  gracePeriodDays: 7,      // After natural plan expiry, the user still has access for this many days.
  frozenPeriodDays: 30,    // After grace ends, UI is frozen for this many days waiting for re-subscription.
  payrollDataClearDays: 30, // After frozen window ends, payroll data is eligible for clearing.
});

let cached = null;
let cachedAt = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute — short enough that admin edits propagate quickly.

/**
 * Returns { gracePeriodDays, frozenPeriodDays, payrollDataClearDays } from the `settings`
 * table. Falls back to DEFAULTS on any read failure or missing field. Cached for CACHE_TTL_MS.
 */
exports.getSubscriptionLifecycleSettings = async () => {
  const now = Date.now();
  if (cached && now - cachedAt < CACHE_TTL_MS) return cached;

  try {
    const row = await setting.findOne({ where: { name: SETTING_NAME }, raw: true });
    const stored = (row?.details && typeof row.details === "object") ? row.details : {};
    cached = {
      gracePeriodDays: Number(stored.gracePeriodDays) > 0 ? Number(stored.gracePeriodDays) : DEFAULTS.gracePeriodDays,
      frozenPeriodDays: Number(stored.frozenPeriodDays) > 0 ? Number(stored.frozenPeriodDays) : DEFAULTS.frozenPeriodDays,
      payrollDataClearDays: Number(stored.payrollDataClearDays) > 0 ? Number(stored.payrollDataClearDays) : DEFAULTS.payrollDataClearDays,
    };
    cachedAt = now;
    return cached;
  } catch (err) {
    customLog(null, "error", { message: "getSubscriptionLifecycleSettings: read failed — using defaults", error: err?.message });
    return { ...DEFAULTS };
  }
};

/**
 * Classify a subscription's current position in the lifecycle relative to its natural
 * expiry date and the configured grace/freeze windows.
 *
 *   ACTIVE      → still inside the paid cycle (subscriptionEndDate is in the future)
 *   GRACE       → past expiry, within `gracePeriodDays`
 *   FROZEN      → past grace, within `frozenPeriodDays` after grace ended
 *   CLEAR_ELIGIBLE → past frozen window, payroll data clear eligible
 *   NONE        → no expired subscription to classify
 */
exports.classifyLifecycleState = (expiredEndDate, settings) => {
  if (!expiredEndDate) return "NONE";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(expiredEndDate);
  end.setHours(0, 0, 0, 0);
  const daysSinceExpiry = Math.floor((today - end) / (1000 * 60 * 60 * 24));

  if (daysSinceExpiry < 0) return "ACTIVE";
  if (daysSinceExpiry <= settings.gracePeriodDays) return "GRACE";
  if (daysSinceExpiry <= settings.gracePeriodDays + settings.frozenPeriodDays) return "FROZEN";
  return "CLEAR_ELIGIBLE";
};

exports.SUBSCRIPTION_LIFECYCLE_SETTING_NAME = SETTING_NAME;
exports.SUBSCRIPTION_LIFECYCLE_DEFAULTS = DEFAULTS;
