'use strict';

const Sequelize = require('sequelize');
const axios = require('axios');
const moment = require('moment');
const sequelizeConfig = require('../configs/database/index');
const { customLog } = require('../utils/loggerHelper');
const { createNotification } = require('../models/use-cases/notification');
const emailer = require('../utils/email/emailer');
const { formatNumberWithLocalString } = require('../utils/formatter');
const { generateRenewalScheduledEmail, generateSubscriptionFailureEmail } = require('../utils/emailTemplates');
const { fetchPartnerDetails } = require('../models/use-cases/systemUser');
const { getWhatsAppMerchantClientCreds } = require('../utils/cashfreeProducts');
const { v4: uuidv4 } = require('uuid');
const operatorsData = require('../utils/operatorsData.json');
const { resolveEmailTemplate } = require('./emailTemplateResolver');
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require('../utils/emailTemplateKeys');
const { v2LayoutVariables } = require('../utils/emailTemplate/sharedLayout');

const frontendBaseUrl = process.env.NODE_ENV === 'production' ? process.env.PRODUCTION_URL : process.env.FRONTEND_STAGING_URL;
const { computeWhatsAppRenewalCharge } = require('../utils/whatsappRenewalCharge');

const ORDER_KIND = Object.freeze({
  SUBSCRIPTION_CHARGE: 'SUBSCRIPTION_CHARGE',
});

// Shared Cashfree connection (apiUrl + x-api-version) + default creds, from the canonical
// subscriptions merchant. For WhatsApp we keep these and replace ONLY clientId/clientSecret below.
const getCashfreeCredentials = async () => {
  const rows = await sequelizeConfig.query(
    `SELECT v.apiUrl, v.optional1 AS clientId, v.optional2 AS clientSecret, v.optional3 AS version
     FROM serviceOperators so
     JOIN vendors v ON so.vendorId = v.id
     WHERE so.accessKey = '${operatorsData["cashfreeSubscriptions"]["accessKey"]}'
     LIMIT 1`,
    { type: Sequelize.QueryTypes.SELECT }
  );
  return rows[0] ?? null;
};

// Runs daily. Finds all active WhatsApp subscriptions (with Cashfree mandate) expiring
// in 2 days and triggers a renewal charge via Cashfree /pg/subscriptions/pay.
// The CHARGE webhook in cashFreeGateway.processWebhookEventById handles the result.
exports.triggerWhatsAppSubscriptionCharges = async () => {
  // One correlation id per cron run, threaded through every customLog in this job.
  const traceId = uuidv4();
  try {
    // Self-healing window: charge any mandate-backed sub expiring within the next 2 days
    // (today .. today+2), not just exactly today+2. A single missed/late daily run — downtime, a
    // deploy, or a row whose end date lands after that day's 01:00 cron — would otherwise skip the
    // renewal forever, since the old `= today+2` exact match had no catch-up. Use UTC to match
    // subscriptionAutoRenewal + the generic triggerSubscriptionCharges; the 3-day window also
    // absorbs any residual timezone off-by-one.
    const today = moment.utc().format('YYYY-MM-DD');
    const targetDate = moment.utc().add(2, 'days').format('YYYY-MM-DD');
    // Earliest day Cashfree can auto-debit: NPCI AutoPay requires a ~24h pre-debit notice, so the debit
    // must be scheduled for a FUTURE day (never same-day). Each charge is scheduled for the subscription's
    // OWN end date (per-row paymentScheduleDate below) so the renewal lands ON the end date when the row is
    // caught 1–2 days early; this floor only applies when a row is first seen on/after its end date.
    const earliestChargeDay = moment.utc().add(1, 'days').format('YYYY-MM-DD');

    customLog(traceId, 'info', {
      message: 'triggerWhatsAppSubscriptionCharges: starting',
      targetDate,
    });

    // Fetch active base subscriptions expiring on targetDate. The charge amount is priced fresh
    // per subscription below (computeWhatsAppRenewalCharge) — not from what was last paid.
    const subscriptions = await sequelizeConfig.query(
      `SELECT
         ws.id,
         ws.vendorSubscriptionId,
         ws.credentialId,
         ws.corporateUserId,
         ws.packageId,
         ws.billingType,
         ws.billingPlan,
         ws.projectId,
         DATE_FORMAT(ws.subscriptionEndDate, '%Y-%m-%d') AS endDate,
         cu.email,
         cu.name AS corporateName,
         cr.username,
         cr.registeredBy AS registeredBy
       FROM whatsAppSubscriptions ws
       LEFT JOIN corporateUsers cu ON cu.id = ws.corporateUserId
       LEFT JOIN credentials cr ON cr.id = ws.credentialId
       WHERE ws.status = 'ACTIVE'
         AND ws.isCustom = 0
         AND ws.isCancelled = 0
         AND ws.vendorSubscriptionId IS NOT NULL
         AND DATE(ws.subscriptionEndDate) BETWEEN :today AND :targetDate`,
      { replacements: { today, targetDate }, type: Sequelize.QueryTypes.SELECT }
    );

    if (!subscriptions.length) {
      customLog(traceId, 'info', {
        message: 'triggerWhatsAppSubscriptionCharges: no subscriptions due in 2 days',
        targetDate,
      });
      return;
    }

    customLog(traceId, 'info', {
      message: `triggerWhatsAppSubscriptionCharges: found ${subscriptions.length} subscription(s) to charge`,
      targetDate,
    });

    // Keep the shared connection (apiUrl + x-api-version) from the subscriptions merchant, and replace
    // ONLY clientId/clientSecret with WhatsApp's own merchant creds — strict, no fallback.
    const credentials = await getCashfreeCredentials();
    const waCreds = await getWhatsAppMerchantClientCreds();
    if (!credentials || !waCreds?.clientId || !waCreds?.clientSecret) {
      customLog(traceId, 'error', {
        message: 'triggerWhatsAppSubscriptionCharges: WhatsApp Cashfree credentials not found — aborting',
      });
      return;
    }
    credentials.clientId = waCreds.clientId;
    credentials.clientSecret = waCreds.clientSecret;

    const results = { success: 0, skipped: 0, failed: 0 };

    for (const sub of subscriptions) {
      try {
        // Current plan price - discount + platform fee + current add-on prices
        const charge = await computeWhatsAppRenewalCharge({
          packageId: sub.packageId,
          billingType: sub.billingType,
          corporateUserId: sub.corporateUserId,
          credentialId: sub.credentialId,
        });
        const amount = charge?.amount;

        if (!amount || amount <= 0) {
          results.skipped++;
          customLog(traceId, 'info', {
            message: 'triggerWhatsAppSubscriptionCharges: zero amount or package has no price, skipping',
            subscriptionId: sub.id,
            packageId: sub.packageId,
          });
          continue;
        }
        customLog(traceId, 'info', {
          message: 'triggerWhatsAppSubscriptionCharges: renewal amount computed',
          subscriptionId: sub.id,
          ...charge,
        });

        // Key the referenceNo on the subscription's OWN end date (its renewal cycle), not the moving
        // today+2. This makes it stable across the self-healing window — the same cycle resolves to one
        // referenceNo whether the charge fires on day-2, day-1 or day-0, so the idempotency check below
        // guarantees exactly one charge per cycle (no double-charge on consecutive runs). It also matches
        // the admin renewal report's referenceNo construction (renewalCharges.js builds
        // `wa_charge_<id>_<endDate>`), keeping its REQUESTED/PREVIEW dedup correct.
        const referenceNo = `wa_charge_${sub.id}_${sub.endDate}`;
        const paymentRefId = Date.now();

        // Debit ON the subscription's end date so the renewal lands on/before it (proper user journey),
        // not the day after. Caught 1–2 days early (the normal self-healing window) → schedules the debit
        // exactly on the end date. Only if the row is first caught on/after its end date do we fall back to
        // the earliest allowed day, since AutoPay can't debit same-day. referenceNo is keyed on the same
        // end date, so idempotency guarantees one charge per cycle regardless of which window day fires.
        const scheduleDay = sub.endDate >= earliestChargeDay ? sub.endDate : earliestChargeDay;
        const paymentScheduleDate = moment(scheduleDay, 'YYYY-MM-DD').startOf('day').utcOffset('+05:30').format();

        // Idempotency: skip if a charge order already exists for this subscription's cycle
        const [existing] = await sequelizeConfig.query(
          `SELECT id FROM paymentGatewayOrders
           WHERE referenceNo = :referenceNo AND orderKind = :orderKind
           LIMIT 1`,
          {
            replacements: { referenceNo, orderKind: ORDER_KIND.SUBSCRIPTION_CHARGE },
            type: Sequelize.QueryTypes.SELECT,
          }
        );

        if (existing) {
          results.skipped++;
          customLog(traceId, 'info', {
            message: 'triggerWhatsAppSubscriptionCharges: charge order already exists, skipping',
            subscriptionId: sub.id,
            targetDate,
          });
          continue;
        }

        // The breakdown is read back by the CHARGE webhook (renewWhatsAppSubscription) to split the
        // renewed rows and record the surcharge on the order.
        const pgOrderPaymentData = JSON.stringify({
          kind: 'WA_SUBSCRIPTION_CHARGE',
          subscriptionId: sub.id,
          targetDate: sub.endDate,
          vendorSubscriptionId: sub.vendorSubscriptionId,
          ...charge,
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

        try {
          customLog(traceId,"info", {
            message: "[subscription:charge] request",
            endpoint: "Cashfree /pg/subscriptions/pay (whatsapp)",
            subscriptionId: sub.id,
            vendorSubscriptionId: sub.vendorSubscriptionId,
            corporateUserId: sub.corporateUserId,
            email: sub.email,
            amount,
            referenceNo,
            paymentScheduleDate,
          }, "VENDOR");
          const cfResponse = await axios({
            method: 'POST',
            url: `${credentials.apiUrl}/pg/subscriptions/pay`,
            headers: {
              'x-api-version': credentials.version,
              'x-client-id': credentials.clientId,
              'x-client-secret': credentials.clientSecret,
              'Content-Type': 'application/json',
            },
            data: {
              subscription_id: sub.vendorSubscriptionId,
              payment_id: referenceNo,
              payment_amount: amount,
              payment_schedule_date: paymentScheduleDate,
              payment_type: 'CHARGE',
              payment_remarks: `WA_Renewal_${sub.billingPlan}_${sub.billingType}`.replace(/[^a-zA-Z0-9._-]/g, '_'),
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
          customLog(traceId, 'info', {
            message: 'triggerWhatsAppSubscriptionCharges: charge triggered successfully',
            subscriptionId: sub.id,
            referenceNo,
            targetDate,
          }, 'VENDOR');

          // Notify the user that their WhatsApp renewal charge has been scheduled — parity with the
          // Peko trigger. The CHARGE webhook sends the "Renewal Successful" notification + receipt once
          // Cashfree confirms the payment (same day or up to 2 days later). Non-fatal: a notification/
          // email blip must not fail the charge batch — the charge itself already succeeded.
          const planLabel = `WhatsApp ${sub.billingPlan === 'BASIC' ? 'Basic' : 'Pro'}`;
          if (sub.username) {
            try {
              await createNotification({
                notificationTitle: 'Subscription Renewal Scheduled',
                notificationBrief: `Your ${planLabel} subscription renewal of ₹${formatNumberWithLocalString(amount)} will be processed soon. We'll confirm once the payment is complete.`,
                notificationTo: [sub.username],
                notificationCategory: 'CORPORATE',
                notificationBy: 'ADMIN',
              });
            } catch (notifErr) {
              customLog(traceId, 'error', {
                message: "Failed to create WhatsApp 'renewal scheduled' notification",
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
                `Your ${planLabel} subscription renewal is scheduled`,
                generateRenewalScheduledEmail({
                  corporateName: sub.corporateName,
                  packageName: planLabel,
                  amount,
                  endDate: moment(sub.endDate).format('MMMM D, YYYY'),
                  partnerDetails,
                }),
              );
              if (!emailResult?.status) {
                customLog(traceId, 'error', {
                  message: "Failed to send WhatsApp 'renewal scheduled' email",
                  subscriptionId: sub.id,
                  email: sub.email,
                  reason: emailResult?.message,
                });
              }
            } catch (emailErr) {
              customLog(traceId, 'error', {
                message: "Threw while sending WhatsApp 'renewal scheduled' email",
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

          // Renewal charge failed — tell the user (notification + email) so they can update their
          // payment method and avoid interruption. There is no automatic retry on the WhatsApp path,
          // so the copy must NOT promise one. Non-fatal: a messaging blip must not abort the batch.
          const planLabel = `WhatsApp ${sub.billingPlan === 'BASIC' ? 'Basic' : 'Pro'}`;
          if (sub.username) {
            try {
              await createNotification({
                notificationTitle: 'Subscription Renewal Failed',
                notificationBrief: `We couldn't process the renewal payment of ₹${formatNumberWithLocalString(amount)} for your ${planLabel} subscription. Please update your payment method or renew to avoid interruption.`,
                notificationTo: [sub.username],
                notificationCategory: 'CORPORATE',
                notificationBy: 'ADMIN',
              });
            } catch (notifErr) {
              customLog(traceId, 'error', {
                message: "Failed to create WhatsApp 'renewal failed' notification",
                subscriptionId: sub.id,
                username: sub.username,
                error: notifErr?.message ?? notifErr,
              });
            }
          }
          if (sub.email) {
            try {
              // Branded partner logo/footer, matching the other subscription emails.
              const partnerDetails = await fetchPartnerDetails(sub?.registeredBy)
              const loginUrl = `${frontendBaseUrl}/auth/login`;
              const subject = `Your ${planLabel} subscription renewal failed`;
              // errData is the raw Cashfree error response/message captured above - surface it
              // as the customer-facing reason where it's a plain readable string.
              const failedReason = (typeof errData === 'string' ? errData : errData?.message) || 'Payment could not be processed';
              const resolved = await resolveEmailTemplate({
                key: EMAIL_TEMPLATE_KEYS.SUBSCRIPTION_RENEWAL_FAILURE,
                service: EMAIL_TEMPLATE_SERVICES.SCHEDULER,
                variables: {
                  name: sub.corporateName,
                  packageName: planLabel,
                  billingType: (sub.billingType || '').toLowerCase(),
                  payableAmount: amount,
                  formattedDate: moment().format('YYYY-MM-DD'),
                  failedReason,
                  loginUrl,
                  branding: partnerDetails?.branding || 'Peko',
                  website: partnerDetails?.website || 'https://www.peko.one',
                  ...v2LayoutVariables(partnerDetails),
                },
                fallback: () => generateSubscriptionFailureEmail(
                  sub.corporateName,
                  { packageName: planLabel, billingType: sub.billingType },
                  amount,
                  partnerDetails,
                  loginUrl,
                  failedReason,
                ),
                fallbackSubject: subject,
                logTraceId: traceId,
              });
              const failureEmailResult = await emailer.email(
                sub.email,
                resolved.subject,
                resolved.html,
              );
              if (!failureEmailResult?.status) {
                customLog(traceId, 'error', {
                  message: "Failed to send WhatsApp 'renewal failed' email",
                  subscriptionId: sub.id,
                  email: sub.email,
                  reason: failureEmailResult?.message,
                });
              }
            } catch (emailErr) {
              customLog(traceId, 'error', {
                message: "Threw while sending WhatsApp 'renewal failed' email",
                subscriptionId: sub.id,
                email: sub.email,
                error: emailErr?.message ?? emailErr,
              });
            }
          }

          results.failed++;
          customLog(traceId, 'error', {
            message: 'triggerWhatsAppSubscriptionCharges: Cashfree charge API failed',
            subscriptionId: sub.id,
            referenceNo,
            error: errData,
          }, 'VENDOR');
        }
      } catch (subError) {
        results.failed++;
        customLog(traceId, 'error', {
          message: 'triggerWhatsAppSubscriptionCharges: unexpected error processing subscription',
          subscriptionId: sub.id,
          error: subError?.message ?? subError,
        });
      }
    }

    customLog(traceId, 'info', {
      message: 'triggerWhatsAppSubscriptionCharges: completed',
      targetDate,
      results,
    });
  } catch (error) {
    customLog(traceId, 'error', {
      message: 'triggerWhatsAppSubscriptionCharges: unexpected top-level error',
      error: error?.message ?? error,
    });
  }
};
