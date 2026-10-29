const Sequelize = require("sequelize");
const axios = require("axios");
const moment = require("moment");
const sequelizeConfig = require("../configs/database/index");
const { customLog } = require("../utils/loggerHelper");
const { createNotification } = require("../models/use-cases/notification");
const emailer = require("../utils/email/emailer");
const { formatNumberWithLocalString } = require("../utils/formatter");
const { generateRenewalScheduledEmail } = require("../utils/emailTemplates");
const { fetchPartnerDetails } = require("../models/use-cases/systemUser");
const { resolveMerchantCredentials, getMerchantAccessKeyForSubscription } = require("../utils/cashfreeProducts");
const { calculateTaxBreakdown } = require("./GSTandTAXcalculation");
const { v4: uuidv4 } = require("uuid");
// ─── Local constants (no cross-service imports allowed) ───────────────────────
const ORDER_KIND = Object.freeze({
  PAYMENT_GATEWAY: 'PAYMENT_GATEWAY',
  SUBSCRIPTION_AUTH: 'SUBSCRIPTION_AUTH',
  SUBSCRIPTION_CHARGE: 'SUBSCRIPTION_CHARGE',
});

// Copied from paymentGateway/controllers/corporate/cashFreeGateway.js — keep in sync manually.
const SUBSCRIPTION_PLAN_MAX_AMOUNT = 14999;
const SUBSCRIPTION_PLAN_MAX_AMOUNT_ANNUAL = 100000;
const resolvePlanMaxAmount = (billingType) =>
  String(billingType || "").toUpperCase() === "ANNUALLY" ? SUBSCRIPTION_PLAN_MAX_AMOUNT_ANNUAL : SUBSCRIPTION_PLAN_MAX_AMOUNT;

// Copied from paymentGateway/utils/resolveAddonTierPricing.js — keep in sync manually.
// Cross-service imports are not allowed; each service owns its copy.
function resolveAddonTierPricing(allCashbacks, groupSub, individualCashback) {
  if (!individualCashback) return null;
  const groupPackageId = groupSub?.package?.id;
  let tierRow = individualCashback;
  if (groupPackageId != null && Array.isArray(allCashbacks)) {
    const groupCashback = allCashbacks.find(
      (row) => row.package?.packageType === "GROUP" && Number(row.packageId) === Number(groupPackageId)
    );
    if (groupCashback && groupCashback.unitPrice != null && groupCashback.unitPrice !== "") {
      const n = parseFloat(groupCashback.unitPrice);
      if (!Number.isNaN(n)) tierRow = groupCashback;
    }
  }
  const unitPrice = parseFloat(tierRow.unitPrice);
  const baseLimit = tierRow.baseLimit != null && tierRow.baseLimit !== "" ? parseFloat(tierRow.baseLimit) : null;
  const isDynamicUnitPricing = !!tierRow.serviceOperator?.isDynamicUnitPricing;
  return { tierRow, unitPrice, baseLimit, isDynamicUnitPricing, packageIdForSubscription: individualCashback.packageId };
}

// ─── DB operations for calculatePlanAmount ────────────────────────────────────
// Raw-SQL implementations of the same interface that paymentGateway satisfies via Sequelize models.

const dbOps = {
  /** Returns all active custom (add-on) subscriptions for the corporate. */
  findAllAddonSubscription: async (corporateId) =>
    sequelizeConfig.query(
      `SELECT s.packageId, s.serviceOperatorId, s.maxLimit
       FROM subscriptions s
       WHERE s.corporateUserId = :corporateId
         AND s.status = 'ACTIVE'
         AND s.isCustom = 1
         AND s.isCancelled = 0
         AND s.subscriptionEndDate IS NOT NULL
         AND DATE(s.subscriptionEndDate) >= CURDATE()`,
      { replacements: { corporateId }, type: Sequelize.QueryTypes.SELECT }
    ),

  /** Returns the active GROUP plan subscription (package id nested as package.id). */
  findExistingGroupPackage: async (corporateId) => {
    const rows = await sequelizeConfig.query(
      `SELECT p.id AS packageId
       FROM subscriptions s
       JOIN packages p ON s.packageId = p.id
       WHERE s.corporateUserId = :corporateId
         AND s.status = 'ACTIVE'
         AND s.isCustom = 0
         AND p.packageType = 'GROUP'
       LIMIT 1`,
      { replacements: { corporateId }, type: Sequelize.QueryTypes.SELECT }
    );
    if (!rows.length) return null;
    return { package: { id: Number(rows[0].packageId) } };
  },

  /** Returns the cashback unit price and pricing type for an add-on, resolved by its
   *  serviceOperatorId. On renewal an addon is re-anchored to the active GROUP package, so
   *  prefer that package's tier row and fall back to the addon's own package row. Keying on
   *  packageId + 'INDIVIDUAL' would miss re-anchored addons whose packageId is the GROUP id. */
  findAddonPrice: async ({ packageId, serviceOperatorId, groupPackageId }) => {
    const rows = await sequelizeConfig.query(
      `SELECT cb.unitPrice, so.isDynamicUnitPricing
       FROM cashbacks cb
       JOIN serviceOperators so ON cb.serviceOperatorId = so.id
       WHERE cb.serviceStatus = 1
         AND ${serviceOperatorId != null
          ? 'cb.serviceOperatorId = :serviceOperatorId AND cb.packageId IN (:groupPackageId, :packageId)'
          : 'cb.packageId = :packageId'}
       ORDER BY (cb.packageId = :groupPackageId) DESC
       LIMIT 1`,
      {
        replacements: {
          serviceOperatorId: serviceOperatorId ?? null,
          groupPackageId: groupPackageId ?? null,
          packageId,
        },
        type: Sequelize.QueryTypes.SELECT,
      }
    );
    return rows[0] ?? null;
  },

  /** Returns all cashback rows for a service (by accessKey), shaped as { unitPrice, packageId, package: { packageType, id } }. */
  findOneServiceCashbacks: async ({ accessKey }) => {
    const rows = await sequelizeConfig.query(
      `SELECT cb.unitPrice, cb.packageId, p.packageType
       FROM cashbacks cb
       JOIN packages p ON cb.packageId = p.id
       JOIN serviceOperators so ON cb.serviceOperatorId = so.id
       WHERE so.accessKey = :accessKey AND cb.serviceStatus = 1`,
      { replacements: { accessKey }, type: Sequelize.QueryTypes.SELECT }
    );
    return rows.map((r) => ({
      unitPrice: r.unitPrice,
      packageId: Number(r.packageId),
      package: { packageType: r.packageType, id: Number(r.packageId) },
    }));
  },
};

async function calculatePlanAmountWithDbOps(
  pkg,
  billingType,
  isAddOns,
  quantity,
  accessKey,
  corporateId,
  dbOps
) {
  const billingTypePropertyName = billingType.toLowerCase();
  let total = parseFloat(pkg.packagePrices[billingTypePropertyName]) - parseFloat(pkg.discount[billingTypePropertyName]);
  let addOnPrice = 0;

  if (!isAddOns) {
    // For any plan renewal (INDIVIDUAL or GROUP), include all active addon subscriptions.
    const addOnSubscriptions = await dbOps.findAllAddonSubscription(corporateId);
    // For a GROUP plan, addons follow the group tier — pass the group package id so
    // findAddonPrice prefers that tier's cashback row over the addon's own package row.
    const groupSub = pkg.packageType === "GROUP" ? await dbOps.findExistingGroupPackage(corporateId) : null;
    const groupPackageId = groupSub?.package?.id ?? null;
    // For an INDIVIDUAL package, scope the addon recompute to its OWN service. Add-ons are stamped with
    // the individual packageId at purchase; pkg.packageId (scheduler spread) or pkg.id (Package entity)
    // resolves to the package id in every caller.
    const renewingPackageId = Number(pkg.packageId ?? pkg.id);

    for (const subscription of addOnSubscriptions) {
      // INDIVIDUAL renewal folds in ONLY its own add-ons — otherwise another individual package's
      // dynamic add-ons would be double-charged across separate renewals. GROUP folds all (one plan).
      if (pkg.packageType === "INDIVIDUAL" && Number(subscription.packageId) !== renewingPackageId) continue;
      const addonData = await dbOps.findAddonPrice({
        packageId: subscription.packageId,
        serviceOperatorId: subscription.serviceOperatorId,
        groupPackageId,
      });
      if (!addonData) continue;
      // Skip static / one-time addons (eSign, Turbo, Invoicing) — isDynamicUnitPricing=false
      // means they do not auto-renew and must not recur in the charge.
      if (!addonData.isDynamicUnitPricing) continue;

      // A recurring addon follows the base cycle: an ANNUAL renewal bills it for the full year (× 12),
      // MONTHLY for one month. Mirror of paymentGateway addonPricing.annualizeAddon — keep in sync.
      const addonLineTotal = parseFloat(addonData.unitPrice) * parseFloat(subscription.maxLimit);
      addOnPrice += String(billingType).toLowerCase() === "annually" ? addonLineTotal * 12 : addonLineTotal;
    }
  }

  if (isAddOns) {
    const allCashbacks = await dbOps.findOneServiceCashbacks({ accessKey });
    if (!allCashbacks || !allCashbacks.length) {
      throw new Error("Couldn't find cashback data");
    }

    const individualCashback = allCashbacks.find((row) => row.package?.packageType === "INDIVIDUAL");
    const groupSub = await dbOps.findExistingGroupPackage(corporateId);
    const tier = resolveAddonTierPricing(allCashbacks, groupSub, individualCashback);
    if (!tier) {
      throw new Error("Couldn't find cashback data");
    }

    addOnPrice = tier.unitPrice * quantity;
  }

  const tax = await calculateTaxBreakdown(addOnPrice + total);

  return {
    price: isAddOns ? addOnPrice : total,
    periodicPrice: tax.grossAmount,
    taxableAmount: tax.taxableAmount,
    taxAmount: tax.taxAmount,
    taxRate: tax.taxRate,
  };
}

const calculatePlanAmount = (pkg, billingType, isAddOns, quantity, accessKey, corporateId) =>
  calculatePlanAmountWithDbOps(pkg, billingType, isAddOns, quantity, accessKey, corporateId, dbOps);

// Exported so the pre-renewal reminder can show the same renewal total this job charges
// (plan + recurring addons) — single source of truth, no divergent copy.
exports.calculatePlanAmount = calculatePlanAmount;

// ─── Main job ─────────────────────────────────────────────────────────────────
// Runs daily (1 AM UTC). Finds all ACTIVE subscriptions expiring in 2 days,
// calculates the renewal amount, persists a SUBSCRIPTION_CHARGE order in
// paymentGatewayOrders, then calls Cashfree /pg/subscriptions/pay directly.
// Cashfree fires a webhook to paymentGateway with the result.
exports.triggerSubscriptionCharges = async () => {
  // One correlation id per cron run, threaded through every customLog in this job.
  const traceId = uuidv4();
  try {
    const targetDate = moment.utc().add(2, "days").format("YYYY-MM-DD");
    const paymentScheduleDate = moment().add(1, "days").startOf("day").utcOffset("+05:30").format();

    customLog(traceId,"info", {
      message: "triggerSubscriptionCharges: starting",
      targetDate,
    });

    // Fetch subscriptions + their package and user details in one query
    const subscriptions = await sequelizeConfig.query(
      `SELECT
         s.id,
         s.vendorSubscriptionId,
         s.corporateUserId,
         s.packageId,
         s.billingType,
         DATE(s.subscriptionEndDate) AS endDate,
         p.packageName,
         p.packageType,
         p.packagePrices,
         p.discount,
         c.username,
         c.email,
         c.registeredBy,
         cu.name AS corporateName
       FROM subscriptions s
       JOIN packages p ON s.packageId = p.id
       JOIN corporateUsers cu ON s.corporateUserId = cu.id
       JOIN credentials c ON cu.credentialId = c.id
       WHERE
         s.status = 'ACTIVE'
         AND s.isCustom = 0
         AND s.isCancelled = 0
         AND s.isGracePeriod = 0
         AND s.vendorSubscriptionId IS NOT NULL
         AND DATE(s.subscriptionEndDate) = :targetDate`,
      { replacements: { targetDate }, type: Sequelize.QueryTypes.SELECT }
    );

    if (!subscriptions.length) {
      customLog(traceId,"info", {
        message: "triggerSubscriptionCharges: no subscriptions due in 2 days",
        targetDate,
      });
      return;
    }

    customLog(traceId,"info", {
      message: `triggerSubscriptionCharges: found ${subscriptions.length} subscription(s) to charge`,
      targetDate,
    });

    const results = { success: 0, skipped: 0, failed: 0 };

    for (const sub of subscriptions) {
      try {
        // MySQL JSON columns arrive as strings from raw queries — parse them
        const pkg = {
          ...sub,
          packagePrices: typeof sub.packagePrices === "string" ? JSON.parse(sub.packagePrices) : sub.packagePrices,
          discount: typeof sub.discount === "string" ? JSON.parse(sub.discount) : sub.discount,
        };

        // Idempotency: skip if a charge-order for this subscription/date already exists
        const referenceNo = `charge_${sub.id}_${targetDate}`;
        const paymentRefId = Date.now();
        const [existing] = await sequelizeConfig.query(
          `SELECT id, referenceNo FROM paymentGatewayOrders
           WHERE referenceNo = :referenceNo AND orderKind = :orderKind
           LIMIT 1`,
          {
            replacements: { referenceNo, orderKind: ORDER_KIND.SUBSCRIPTION_CHARGE },
            type: Sequelize.QueryTypes.SELECT,
          }
        );

        if (existing) {
          results.skipped++;
          customLog(traceId,"info", {
            message: "Charge order already exists for this date, skipping",
            subscriptionId: sub.id,
            targetDate,
          });
          continue;
        }

        // Same pricing logic as paymentGateway cashFreeGateway.calculatePlanAmount
        const chargeAmount = await calculatePlanAmount(pkg, sub.billingType, false, null, null, sub.corporateUserId);
        const amount = chargeAmount.periodicPrice;

        if (!amount || amount <= 0) {
          results.skipped++;
          customLog(traceId,"info", {
            message: "Zero amount — free plan, skipping charge",
            subscriptionId: sub.id,
          });
          continue;
        }

        const planMaxAmount = resolvePlanMaxAmount(sub.billingType);
        if (amount > planMaxAmount) {
          results.failed++;
          await sequelizeConfig.query(
            `UPDATE subscriptions SET isGracePeriod = true WHERE id = :id`,
            { replacements: { id: sub.id }, type: Sequelize.QueryTypes.UPDATE }
          );
          if (sub.username) {
            try {
              await createNotification({
                notificationTitle: 'Subscription Renewal Issue',
                notificationBrief: `We encountered an issue scheduling your ${sub.packageName} subscription renewal. We will retry automatically before your subscription expires.`,
                notificationTo: [sub.username],
                notificationCategory: 'CORPORATE',
                notificationBy: 'ADMIN',
              });
            } catch (notifErr) {
              customLog(traceId, "error", {
                message: "Failed to create cap-exceeded 'Renewal Issue' notification",
                subscriptionId: sub.id,
                error: notifErr?.message ?? notifErr,
              });
            }
          }
          customLog(traceId, "error", {
            message: "EXCEEDS_MANDATE_CAP: gross renewal amount exceeds the mandate's plan_max_amount — charge skipped, user needs re-mandate or one-time payment",
            subscriptionId: sub.id,
            corporateUserId: sub.corporateUserId,
            packageName: sub.packageName,
            billingType: sub.billingType,
            amount,
            taxableAmount: chargeAmount.taxableAmount,
            taxAmount: chargeAmount.taxAmount,
            planMaxAmount,
            vendorSubscriptionId: sub.vendorSubscriptionId,
          }, "VENDOR");
          continue;
        }

        // Resolve the merchant this mandate was created on (from its AUTH order) and charge on the
        // SAME merchant — mandates are merchant-scoped. Store the accessKey on the CHARGE order so the
        // grace-period retry + webhook resolve the same. Today GROUP + INDIVIDUAL both → 'cashfree_subscriptions'.
        const merchantAccessKey = await getMerchantAccessKeyForSubscription(sub.vendorSubscriptionId);
        const credentials = await resolveMerchantCredentials(merchantAccessKey);
        if (!credentials || !credentials.clientId || !credentials.clientSecret) {
          results.failed++;
          customLog(traceId, "error", {
            message: "Cashfree credentials not found for subscription merchant — skipping",
            subscriptionId: sub.id,
            merchantAccessKey,
          });
          continue;
        }
        // Which Cashfree merchant this renewal actually charges on (individual base/addons may ride a
        // per-product merchant; falls back to the shared Peko subscriptions merchant). Logged to debug
        // merchant-scoped mandate issues later.
        customLog(traceId, "info", {
          message: "[subscription:charge] resolved merchant",
          subscriptionId: sub.id,
          vendorSubscriptionId: sub.vendorSubscriptionId,
          packageType: sub.packageType,
          merchantAccessKey,
          merchantSource: credentials.merchantSource,
        }, "VENDOR");

        const pgOrderPaymentData = JSON.stringify({
          kind: "SUBSCRIPTION_CHARGE",
          subscriptionId: sub.id,
          targetDate,
          amount,
          taxableAmount: chargeAmount.taxableAmount,
          taxAmount: chargeAmount.taxAmount,
          taxRate: chargeAmount.taxRate,
          vendorSubscriptionId: sub.vendorSubscriptionId,
          accessKey: merchantAccessKey,
        });
        await sequelizeConfig.query(
          `INSERT INTO paymentGatewayOrders
             (paymentRefId, referenceNo, vendorSubscriptionId, paymentData, status, orderKind, createdAt, updatedAt)
           VALUES
             (:paymentRefId, :referenceNo, :vendorSubscriptionId, :paymentData, 'ORDERED', :orderKind, NOW(), NOW())`,
          {
            replacements: {
              paymentRefId,
              referenceNo,
              vendorSubscriptionId: sub.vendorSubscriptionId,
              paymentData: pgOrderPaymentData,
              orderKind: ORDER_KIND.SUBSCRIPTION_CHARGE,
            },
            type: Sequelize.QueryTypes.INSERT,
          }
        );

        // Call Cashfree /pg/subscriptions/pay directly
        try {
          customLog(traceId, "info", {
            message: "[subscription:charge] request",
            endpoint: "Cashfree /pg/subscriptions/pay",
            subscriptionId: sub.id,
            vendorSubscriptionId: sub.vendorSubscriptionId,
            corporateUserId: sub.corporateUserId,
            email: sub.email,
            amount,
            referenceNo,
            paymentScheduleDate,
          }, "VENDOR");
          const cfResponse = await axios({
            method: "POST",
            url: `${credentials.apiUrl}/pg/subscriptions/pay`,
            headers: {
              "x-api-version": credentials.version,
              "x-client-id": credentials.clientId,
              "x-client-secret": credentials.clientSecret,
              "Content-Type": "application/json",
            },
            data: {
              subscription_id: sub.vendorSubscriptionId,
              payment_id: referenceNo,
              payment_amount: amount,
              payment_schedule_date: paymentScheduleDate,
              payment_type: "CHARGE",
              payment_remarks: `Renewal_${pkg.packageName}_${sub.billingType}`.replace(/[^a-zA-Z0-9._-]/g, "_"),
            },
            timeout: 30000,
          });

          await sequelizeConfig.query(
            `UPDATE paymentGatewayOrders
             SET status = 'IN_PROGRESS', paymentResponse = :rawResponse, updatedAt = NOW()
             WHERE referenceNo = :referenceNo AND orderKind = :orderKind`,
            {
              replacements: {
                referenceNo,
                rawResponse: JSON.stringify(cfResponse.data),
                orderKind: ORDER_KIND.SUBSCRIPTION_CHARGE,
              },
              type: Sequelize.QueryTypes.UPDATE,
            }
          );

          results.success++;
          customLog(traceId,"info", {
            message: "Charge triggered successfully",
            subscriptionId: sub.id,
            corporateUserId: sub.corporateUserId,
            corporateName: sub.corporateName,
            username: sub.username,
            email: sub.email,
            packageName: sub.packageName,
            billingType: sub.billingType,
            amount,
            vendorSubscriptionId: sub.vendorSubscriptionId,
            response: cfResponse.data,
            referenceNo,
            targetDate,
          }, "VENDOR");

          // Notify the user that their renewal charge has been scheduled. The actual
          // CHARGE webhook fires from Cashfree once the payment lands (could be same
          // day or up to 2 days later), at which point the regular "Renewal Successful"
          // notification + email is sent by the webhook handler.
          if (sub.username) {
            try {
              await createNotification({
                notificationTitle: "Subscription Renewal Scheduled",
                notificationBrief: `Your ${sub.packageName} subscription renewal of ₹${formatNumberWithLocalString(amount)} will be processed soon. We'll confirm once the payment is complete.`,
                notificationTo: [sub.username],
                notificationCategory: "CORPORATE",
                notificationBy: "ADMIN",
              });
            } catch (notifErr) {
              // Don't fail the batch if the notification write blips — the charge
              // itself was successful and the webhook will follow up.
              customLog(traceId, "error", {
                message: "Failed to create 'renewal scheduled' notification",
                subscriptionId: sub.id,
                username: sub.username,
                error: notifErr?.message ?? notifErr,
              });
            }
          }
          if (sub.email) {
            try {
              // Branded partner logo/footer, matching the other subscription emails.
              const partnerDetails = await fetchPartnerDetails(sub.registeredBy);
              const emailResult = await emailer.email(
                sub.email,
                `Your ${sub.packageName} subscription renewal is scheduled`,
                generateRenewalScheduledEmail({
                  corporateName: sub.corporateName,
                  packageName: sub.packageName,
                  amount,
                  endDate: moment(sub.endDate).format("MMMM D, YYYY"),
                  partnerDetails,
                }),
              );
              if (!emailResult?.status) {
                customLog(traceId, "error", {
                  message: "Failed to send 'renewal scheduled' email",
                  subscriptionId: sub.id,
                  email: sub.email,
                  reason: emailResult?.message,
                });
              }
            } catch (emailErr) {
              customLog(traceId, "error", {
                message: "Threw while sending 'renewal scheduled' email",
                subscriptionId: sub.id,
                email: sub.email,
                error: emailErr?.message ?? emailErr,
              });
            }
          }
        } catch (cfError) {
          const errData = cfError?.response?.data ?? cfError?.message;

          await sequelizeConfig.query(
            `UPDATE paymentGatewayOrders
             SET status = 'FAILED', paymentResponse = :rawResponse, updatedAt = NOW()
             WHERE referenceNo = :referenceNo AND orderKind = :orderKind`,
            {
              replacements: {
                referenceNo,
                rawResponse: JSON.stringify(errData),
                orderKind: ORDER_KIND.SUBSCRIPTION_CHARGE,
              },
              type: Sequelize.QueryTypes.UPDATE,
            }
          );

          // Mark subscription in grace period so the retry job picks it up
          await sequelizeConfig.query(
            `UPDATE subscriptions SET isGracePeriod = true WHERE id = :id`,
            { replacements: { id: sub.id }, type: Sequelize.QueryTypes.UPDATE }
          );

          if (sub.username) {
            await createNotification({
              notificationTitle: 'Subscription Renewal Issue',
              notificationBrief: `We encountered an issue scheduling your ${sub.packageName} subscription renewal. We will retry automatically before your subscription expires.`,
              notificationTo: [sub.username],
              notificationCategory: 'CORPORATE',
              notificationBy: 'ADMIN',
            });
          }

          results.failed++;
          customLog(traceId,"error", {
            message: "Cashfree charge API call failed",
            subscriptionId: sub.id,
            referenceNo,
            targetDate,
            error: errData,
          }, "VENDOR");
          // Continue — one failure must not abort the rest of the batch
        }
      } catch (subError) {
        results.failed++;
        customLog(traceId,"error", {
          message: "Unexpected error processing subscription",
          subscriptionId: sub.id,
          targetDate,
          error: subError?.message ?? subError,
        });
      }
    }

    customLog(traceId,"info", {
      message: "triggerSubscriptionCharges: completed",
      targetDate,
      results,
    });
  } catch (error) {
    customLog(traceId,"error", {
      message: "triggerSubscriptionCharges: unexpected top-level error",
      error: error?.message ?? error,
    });
  }
};
