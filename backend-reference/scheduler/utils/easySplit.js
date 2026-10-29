/**
 * Cashfree Easy Split config for the ONDC seller-payout sweep.
 *
 * PARK / NARROW / vendor-create live in purchase. This file is only what the
 * scheduler needs to RELEASE a held split: settings, the on/off switch, and
 * cashfree_ondc credentials. Keep those three in step with
 * purchase/utils/easySplit.js.
 */

const { findOne: findOneServiceOperator } = require("../models/use-cases/serviceOperator");
const setting = require("../models/entities/setting");
const { customLog } = require("./loggerHelper");
const operatorsData = require("./operatorsData.json");

const ONDC_ACCESS_KEY = operatorsData["cashFreeOndc"]["accessKey"];
const SETTINGS_NAME = "ONDC_EASY_SPLIT";

/** Same hold tunables as purchase — the ONDC_EASY_SPLIT row is shared. */
const DEFAULT_SETTINGS = {
  payoutHoldEnabled: true,
  defaultReturnWindow: "P2D",
  returnWindowBuffer: "PT12H",
  deferMaxDays: 30,
  deferBaseUrl: null,
  payoutMaxAttempts: 5,
  statusPollThrottleHours: 6,
};

const MASK_FIELDS = ["x-client-secret", "clientSecret", "account_number", "settlementBankAccountNo"];

const log = (logTraceId, level, data) =>
  customLog(logTraceId, level, { scope: "easySplit", ...data }, "VENDOR", MASK_FIELDS);

const errorContext = (error) => ({
  httpStatus: error?.response?.status ?? null,
  cashfreeCode: error?.response?.data?.code ?? error?.response?.data?.type ?? null,
  cashfreeMessage:
    error?.response?.data?.message ?? error?.response?.data?.error_description ?? null,
  cashfreeBody: error?.response?.data ?? null,
  error: error?.message ?? String(error),
});

const getEasySplitSettings = async (logTraceId) => {
  try {
    const row = await setting.findOne({ where: { name: SETTINGS_NAME }, raw: true });
    if (!row?.details) {
      log(logTraceId, "info", {
        step: "settings",
        message: `No ${SETTINGS_NAME} settings row — using built-in defaults`,
        defaults: DEFAULT_SETTINGS,
      });
      return { ...DEFAULT_SETTINGS };
    }
    const details = typeof row.details === "string" ? JSON.parse(row.details) : row.details;
    return { ...DEFAULT_SETTINGS, ...details };
  } catch (error) {
    log(logTraceId, "error", {
      step: "settings",
      message: `Could not read the ${SETTINGS_NAME} settings row — falling back to defaults`,
      settingsName: SETTINGS_NAME,
      ...errorContext(error),
    });
    return { ...DEFAULT_SETTINGS };
  }
};

const isEasySplitEnabled = async (logTraceId) => {
  try {
    const service = await findOneServiceOperator({ accessKey: ONDC_ACCESS_KEY });
    if (!service || Object.prototype.hasOwnProperty.call(service, "error")) {
      log(logTraceId, "error", {
        step: "enabled-check",
        message: `Easy Split OFF — no serviceOperator row with accessKey "${ONDC_ACCESS_KEY}". Create it and set serviceStatus = true.`,
        accessKey: ONDC_ACCESS_KEY,
        lookupError: service?.error ?? null,
      });
      return false;
    }
    if (!service.serviceStatus) {
      log(logTraceId, "info", {
        step: "enabled-check",
        message: `Easy Split OFF — serviceOperator "${ONDC_ACCESS_KEY}" has serviceStatus = false`,
        accessKey: ONDC_ACCESS_KEY,
        serviceOperatorId: service.id ?? null,
      });
      return false;
    }
    return true;
  } catch (error) {
    log(logTraceId, "error", {
      step: "enabled-check",
      message: "Easy Split OFF — the serviceOperator lookup threw",
      accessKey: ONDC_ACCESS_KEY,
      ...errorContext(error),
    });
    return false;
  }
};

const resolveConfig = async (logTraceId) => {
  const service = await findOneServiceOperator({ accessKey: ONDC_ACCESS_KEY });
  if (!service || Object.prototype.hasOwnProperty.call(service, "error")) {
    log(logTraceId, "error", {
      step: "config",
      message: `Service operator "${ONDC_ACCESS_KEY}" not found — cannot reach Cashfree`,
      accessKey: ONDC_ACCESS_KEY,
      lookupError: service?.error ?? null,
    });
    return { error: `Service operator ${ONDC_ACCESS_KEY} not found` };
  }

  const clientId = service.paymentclientid || service.vendor?.optional1;
  const clientSecret = service.paymentclientsecret || service.vendor?.optional2;
  const baseUrl = service.vendor?.apiUrl;

  if (!clientId || !clientSecret || !baseUrl) {
    log(logTraceId, "error", {
      step: "config",
      message: `Incomplete Cashfree configuration on "${ONDC_ACCESS_KEY}"`,
      accessKey: ONDC_ACCESS_KEY,
      serviceOperatorId: service.id ?? null,
      vendorId: service.vendor?.id ?? null,
      have: {
        clientId: Boolean(clientId),
        clientSecret: Boolean(clientSecret),
        baseUrl: Boolean(baseUrl),
      },
      readFrom: {
        clientId: service.paymentclientid ? "serviceOperator.paymentclientid" : "vendor.optional1",
        clientSecret: service.paymentclientsecret
          ? "serviceOperator.paymentclientsecret"
          : "vendor.optional2",
      },
    });
    return { error: `Incomplete Cashfree configuration on ${ONDC_ACCESS_KEY}` };
  }
  return { clientId, clientSecret, baseUrl };
};

module.exports = {
  ONDC_ACCESS_KEY,
  DEFAULT_SETTINGS,
  getEasySplitSettings,
  isEasySplitEnabled,
  resolveConfig,
};
