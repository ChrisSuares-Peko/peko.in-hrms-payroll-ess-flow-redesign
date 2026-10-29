const { v4: uuidv4 } = require("uuid");
const { postWebhook } = require("./pekoEcomClient");
const { findOne: findOneServiceOperator } = require("../models/use-cases/serviceOperator");
const Package = require("../models/entities/package");
const { customLog } = require("./loggerHelper");

const ACCESS_KEY = "ecommerce_store";

const buildPayload = ({ eventType, sub, externalPackageId, amount, previousPekoSubscriptionId }) => ({
  eventId: `evt_${uuidv4()}`,
  eventType,
  occurredAt: new Date().toISOString(),
  data: {
    pekoSubscriptionId: String(sub.projectId),
    pekoUserId: String(sub.credentialId),
    packageId: externalPackageId,
    billingCycle: sub.billingType === "ANNUALLY" ? "annually" : "monthly",
    amount: amount != null ? String(amount) : "0.00",
    currency: "INR",
    currentPeriodStart: new Date(sub.subscriptionStartDate).toISOString(),
    currentPeriodEnd: new Date(sub.subscriptionEndDate).toISOString(),
    ...(previousPekoSubscriptionId ? { previousPekoSubscriptionId: String(previousPekoSubscriptionId) } : {}),
  },
});

const loadVendorAndPackage = async (packageId) => {
  const operator = await findOneServiceOperator({ accessKey: ACCESS_KEY });
  if (!operator || !operator.vendor) return null;
  const apiUrl = operator.vendor.apiUrl;
  const secret = operator.vendor.optional1;
  if (!apiUrl || !secret) return null;

  const pkg = await Package.findOne({
    where: { id: packageId },
    attributes: ["id", "externalId"],
    raw: true,
  });
  if (!pkg || !pkg.externalId) return null;

  return { apiUrl, secret, externalPackageId: pkg.externalId };
};

const send = async ({ eventType, sub, packageId, amount, previousPekoSubscriptionId }) => {
  if (!sub?.projectId) {
    customLog(null, "error", {
      message: `[pekoEcom] ${eventType} aborted — missing projectId (chain subscription id)`,
      data: { subscriptionRowId: sub?.id ?? null, credentialId: sub?.credentialId ?? null },
    });
    return;
  }
  try {
    const ctx = await loadVendorAndPackage(packageId);
    if (!ctx) {
      customLog(null, "info", {
        message: `[pekoEcom] skipping ${eventType} — vendor/package not configured`,
      });
      return;
    }
    const payload = buildPayload({
      eventType,
      sub,
      externalPackageId: ctx.externalPackageId,
      amount,
      previousPekoSubscriptionId,
    });
    customLog(null, "info", {
      message: `[pekoEcom] payload`,
      payload,
    });
    const resp = await postWebhook({ apiUrl: ctx.apiUrl, secret: ctx.secret, payload });
    customLog(null, "info", {
      message: `[pekoEcom] ${eventType} delivered (${resp.status})`,
      eventId: payload.eventId,
    });
  } catch (err) {
    customLog(null, "error", {
      message: `[pekoEcom] ${eventType} delivery failed`,
      data: err?.response?.data || err?.message || err,
    });
  }
};

exports.fireSubscriptionCreated = ({ sub, packageId, amount }) =>
  send({ eventType: "subscription.created", sub, packageId, amount });

exports.fireSubscriptionUpgraded = ({ sub, packageId, amount, previousPekoSubscriptionId }) =>
  send({ eventType: "subscription.upgraded", sub, packageId, amount, previousPekoSubscriptionId });

exports.fireSubscriptionRenewed = ({ sub, packageId, amount }) =>
  send({ eventType: "subscription.renewed", sub, packageId, amount });

exports.fireSubscriptionCanceled = ({ sub, packageId }) =>
  send({ eventType: "subscription.canceled", sub, packageId, amount: "0.00" });

exports.fireSubscriptionPaymentFailed = ({ sub, packageId, amount }) =>
  send({ eventType: "subscription.payment_failed", sub, packageId, amount });
