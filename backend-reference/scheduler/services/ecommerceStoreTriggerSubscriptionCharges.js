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
const { resolveMerchantCredentials, getMerchantAccessKeyForSubscription } = require('../utils/cashfreeProducts');
const { calculateTaxBreakdown } = require('../services/GSTandTAXcalculation');
const { v4: uuidv4 } = require('uuid');

const ORDER_KIND = Object.freeze({
  SUBSCRIPTION_CHARGE: 'SUBSCRIPTION_CHARGE',
});

const ECOMMERCE_STORE_ACCESS_CODE = 'ecommerce_store';

// Daily: charges Peko Commerce mandates expiring in 2 days via Cashfree /pg/subscriptions/pay.
exports.triggerEcommerceStoreSubscriptionCharges = async () => {
  const traceId = uuidv4();
  try {
    // Self-healing window so a missed daily run doesn't skip a renewal forever.
    const today = moment.utc().format('YYYY-MM-DD');
    const targetDate = moment.utc().add(2, 'days').format('YYYY-MM-DD');
    // NPCI AutoPay needs ~24h pre-debit notice — never schedule same-day.
    const earliestChargeDay = moment.utc().add(1, 'days').format('YYYY-MM-DD');

    customLog(traceId, 'info', {
      message: 'triggerEcommerceStoreSubscriptionCharges: starting',
      targetDate,
    });

    const subscriptions = await sequelizeConfig.query(
      `SELECT
         ss.id,
         ss.vendorSubscriptionId,
         ss.credentialId,
         ss.corporateUserId,
         ss.packageId,
         ss.billingType,
         DATE_FORMAT(ss.subscriptionEndDate, '%Y-%m-%d') AS endDate,
         p.packageName,
         p.packagePrices,
         p.discount AS packageDiscount,
         cu.email,
         cu.name AS corporateName,
         cr.username,
         cr.registeredBy AS registeredBy
       FROM serviceSubscriptions ss
       JOIN packages p ON p.id = ss.packageId AND p.accessCode = :accessCode
       LEFT JOIN corporateUsers cu ON cu.id = ss.corporateUserId
       LEFT JOIN credentials cr ON cr.id = ss.credentialId
       WHERE ss.status = 'ACTIVE'
         AND ss.isCancelled = 0
         AND ss.isGracePeriod = 0
         AND ss.vendorSubscriptionId IS NOT NULL
         AND DATE(ss.subscriptionEndDate) BETWEEN :today AND :targetDate`,
      { replacements: { accessCode: ECOMMERCE_STORE_ACCESS_CODE, today, targetDate }, type: Sequelize.QueryTypes.SELECT }
    );

    if (!subscriptions.length) {
      customLog(traceId, 'info', {
        message: 'triggerEcommerceStoreSubscriptionCharges: no subscriptions due in 2 days',
        targetDate,
      });
      return;
    }

    customLog(traceId, 'info', {
      message: `triggerEcommerceStoreSubscriptionCharges: found ${subscriptions.length} subscription(s) to charge`,
      targetDate,
    });

    const results = { success: 0, skipped: 0, failed: 0 };

    for (const sub of subscriptions) {
      try {
        // Fresh recompute every cycle — same as a new purchase, no coupon carried forward.
        const packagePrices = typeof sub.packagePrices === 'string' ? JSON.parse(sub.packagePrices) : sub.packagePrices;
        const packageDiscount = typeof sub.packageDiscount === 'string' ? JSON.parse(sub.packageDiscount) : sub.packageDiscount;
        const isAnnual = sub.billingType === 'ANNUALLY';
        const listPrice = parseFloat((isAnnual ? packagePrices?.annually : packagePrices?.monthly) || 0) || 0;
        const discountAmount = parseFloat((isAnnual ? packageDiscount?.annually : packageDiscount?.monthly) || 0) || 0;
        const basePrice = Math.max(0, listPrice - discountAmount);

        // GST is added on top of (price - discount); Peko Commerce carries no platform fee.
        const { grossAmount: amount } = await calculateTaxBreakdown(basePrice);

        if (!amount || amount <= 0) {
          results.skipped++;
          customLog(traceId, 'info', {
            message: 'triggerEcommerceStoreSubscriptionCharges: zero amount, skipping',
            subscriptionId: sub.id,
          });
          continue;
        }

        // Renew on the same merchant the mandate was created on.
        const merchantAccessKey = await getMerchantAccessKeyForSubscription(sub.vendorSubscriptionId);
        const credentials = await resolveMerchantCredentials(merchantAccessKey);
        if (!credentials || !credentials.clientId || !credentials.clientSecret) {
          results.failed++;
          customLog(traceId, 'error', {
            message: 'triggerEcommerceStoreSubscriptionCharges: could not resolve Cashfree merchant credentials — skipping',
            subscriptionId: sub.id,
            merchantAccessKey,
          });
          continue;
        }

        const referenceNo = `ecom_charge_${sub.id}_${sub.endDate}`;
        const paymentRefId = Date.now();

        const scheduleDay = sub.endDate >= earliestChargeDay ? sub.endDate : earliestChargeDay;
        const paymentScheduleDate = moment(scheduleDay, 'YYYY-MM-DD').startOf('day').utcOffset('+05:30').format();

        // Idempotency: skip if already charged for this cycle.
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
            message: 'triggerEcommerceStoreSubscriptionCharges: charge order already exists, skipping',
            subscriptionId: sub.id,
            targetDate,
          });
          continue;
        }

        const pgOrderPaymentData = JSON.stringify({
          kind: 'ECOMMERCE_STORE_SUBSCRIPTION_CHARGE',
          subscriptionId: sub.id,
          targetDate: sub.endDate,
          amount,
          listPrice,
          discountAmount,
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

        try {
          customLog(traceId, 'info', {
            message: '[subscription:charge] request',
            endpoint: 'Cashfree /pg/subscriptions/pay (ecommerce_store)',
            subscriptionId: sub.id,
            vendorSubscriptionId: sub.vendorSubscriptionId,
            corporateUserId: sub.corporateUserId,
            email: sub.email,
            amount,
            referenceNo,
            paymentScheduleDate,
          }, 'VENDOR');
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
              payment_remarks: `ECOM_Renewal_${sub.billingType}`.replace(/[^a-zA-Z0-9._-]/g, '_'),
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
            message: 'triggerEcommerceStoreSubscriptionCharges: charge triggered successfully',
            subscriptionId: sub.id,
            referenceNo,
            targetDate,
          }, 'VENDOR');

          if (sub.username) {
            try {
              await createNotification({
                notificationTitle: 'Subscription Renewal Scheduled',
                notificationBrief: `Your Peko Commerce ${sub.packageName} plan renewal of ₹${formatNumberWithLocalString(amount)} will be processed soon. We'll confirm once the payment is complete.`,
                notificationTo: [sub.username],
                notificationCategory: 'CORPORATE',
                notificationBy: 'ADMIN',
              });
            } catch (notifErr) {
              customLog(traceId, 'error', {
                message: "Failed to create Peko Commerce 'renewal scheduled' notification",
                subscriptionId: sub.id,
                username: sub.username,
                error: notifErr?.message ?? notifErr,
              });
            }
          }
          if (sub.email) {
            try {
              const partnerDetails = await fetchPartnerDetails(sub.registeredBy)
              const emailResult = await emailer.email(
                sub.email,
                `Your Peko Commerce ${sub.packageName} plan renewal is scheduled`,
                generateRenewalScheduledEmail({
                  corporateName: sub.corporateName,
                  packageName: sub.packageName,
                  amount,
                  endDate: moment(sub.endDate).format('MMMM D, YYYY'),
                  partnerDetails,
                }),
              );
              if (!emailResult?.status) {
                customLog(traceId, 'error', {
                  message: "Failed to send Peko Commerce 'renewal scheduled' email",
                  subscriptionId: sub.id,
                  email: sub.email,
                  reason: emailResult?.message,
                });
              }
            } catch (emailErr) {
              customLog(traceId, 'error', {
                message: "Threw while sending Peko Commerce 'renewal scheduled' email",
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

          // Flag for grace-period retry.
          await sequelizeConfig.query(
            `UPDATE serviceSubscriptions SET isGracePeriod = 1 WHERE id = :id`,
            { replacements: { id: sub.id }, type: Sequelize.QueryTypes.UPDATE }
          );

          if (sub.username) {
            try {
              await createNotification({
                notificationTitle: 'Subscription Renewal Issue',
                notificationBrief: `We couldn't process the renewal payment of ₹${formatNumberWithLocalString(amount)} for your Peko Commerce ${sub.packageName} plan. We'll retry automatically before your subscription expires.`,
                notificationTo: [sub.username],
                notificationCategory: 'CORPORATE',
                notificationBy: 'ADMIN',
              });
            } catch (notifErr) {
              customLog(traceId, 'error', {
                message: "Failed to create Peko Commerce 'renewal issue' notification",
                subscriptionId: sub.id,
                username: sub.username,
                error: notifErr?.message ?? notifErr,
              });
            }
          }
          if (sub.email) {
            try {
              const failureEmailResult = await emailer.email(
                sub.email,
                `Your Peko Commerce ${sub.packageName} plan renewal failed`,
                generateSubscriptionFailureEmail(
                  sub.corporateName,
                  { packageName: sub.packageName, billingType: sub.billingType },
                  amount,
                ),
              );
              if (!failureEmailResult?.status) {
                customLog(traceId, 'error', {
                  message: "Failed to send Peko Commerce 'renewal failed' email",
                  subscriptionId: sub.id,
                  email: sub.email,
                  reason: failureEmailResult?.message,
                });
              }
            } catch (emailErr) {
              customLog(traceId, 'error', {
                message: "Threw while sending Peko Commerce 'renewal failed' email",
                subscriptionId: sub.id,
                email: sub.email,
                error: emailErr?.message ?? emailErr,
              });
            }
          }

          results.failed++;
          customLog(traceId, 'error', {
            message: 'triggerEcommerceStoreSubscriptionCharges: Cashfree charge API failed',
            subscriptionId: sub.id,
            referenceNo,
            error: errData,
          }, 'VENDOR');
        }
      } catch (subError) {
        results.failed++;
        customLog(traceId, 'error', {
          message: 'triggerEcommerceStoreSubscriptionCharges: unexpected error processing subscription',
          subscriptionId: sub.id,
          error: subError?.message ?? subError,
        });
      }
    }

    customLog(traceId, 'info', {
      message: 'triggerEcommerceStoreSubscriptionCharges: completed',
      targetDate,
      results,
    });
  } catch (error) {
    customLog(traceId, 'error', {
      message: 'triggerEcommerceStoreSubscriptionCharges: unexpected top-level error',
      error: error?.message ?? error,
    });
  }
};
