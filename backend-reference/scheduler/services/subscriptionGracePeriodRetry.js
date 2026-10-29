const Sequelize = require("sequelize");
const axios = require("axios");
const moment = require("moment");
const sequelizeConfig = require("../configs/database/index");
const { customLog } = require("../utils/loggerHelper");
const { createNotification } = require("../models/use-cases/notification");
const emailer = require("../utils/email/emailer");
const { generateSubscriptionFailureEmail } = require("../utils/emailTemplates");
const { fetchSubscriptionForAutoRenewalRetry, fetchWhatsAppSubscriptionForAutoRenewalRetry, fetchEcommerceStoreSubscriptionForAutoRenewalRetry } = require("../models/use-cases/subscription");
const { getWhatsAppMerchantClientCreds, resolveMerchantCredentials, getMerchantAccessKeyForSubscription } = require("../utils/cashfreeProducts");
const { stopWhatsAppProjectBilling } = require("../utils/whatsappProjectBilling");
const { v4: uuidv4 } = require("uuid");
const operatorsData = require("../utils/operatorsData.json");
const { partnerLogos } = require("../utils/partnerLogos");
const { fetchPartnerDetails } = require("../models/use-cases/systemUser");
const { resolveEmailTemplate } = require("./emailTemplateResolver");
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require("../utils/emailTemplateKeys");
const { v2LayoutVariables } = require("../utils/emailTemplate/sharedLayout");

const frontendBaseUrl = process.env.NODE_ENV === "production" ? process.env.PRODUCTION_URL : process.env.FRONTEND_STAGING_URL;
const { computeWhatsAppRenewalCharge } = require("../utils/whatsappRenewalCharge");

const ORDER_KIND_SUBSCRIPTION_CHARGE = "SUBSCRIPTION_CHARGE";

exports.subscriptionGracePeriodRetry = async () => {
    // One correlation id per cron run, threaded through every customLog in this job (incl. helpers).
    const traceId = uuidv4();
    try {
        const graceSubscriptions = await fetchSubscriptionForAutoRenewalRetry();
        if (!graceSubscriptions.length) return;

        customLog(traceId,"info", {
            message: `subscriptionGracePeriodRetry: processing ${graceSubscriptions.length} grace period subscription(s)`,
        });

        // Shared subscriptions merchant — used as the WhatsApp base below; Peko subs resolve their own
        // merchant per-sub (a mandate is merchant-scoped). resolveMerchantCredentials('cashfree_subscriptions')
        // is byte-identical to the previous getCashfreeCredentials().
        const credentials = await resolveMerchantCredentials(operatorsData["cashfreeSubscriptions"]["accessKey"]);
        const today = moment.utc().format("YYYY-MM-DD");
        const paymentScheduleDate = moment().startOf("day").utcOffset("+05:30").format();

        for (const sub of graceSubscriptions) {
            try {
                if (!sub.vendorSubscriptionId) {
                    // No mandate on record — Cashfree cannot be charged. Expire and downgrade
                    // immediately rather than retrying forever with no mechanism to collect.
                    customLog(traceId, "info", {
                        message: "subscriptionGracePeriodRetry: no vendorSubscriptionId — expiring and downgrading",
                        subscriptionId: sub.id,
                    });
                    await expireGraceSubscription(sub, traceId);
                    continue;
                }

                // Check previous charge outcomes for this subscription
                const [countRow] = await sequelizeConfig.query(
                    `SELECT
                        SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) AS failedCount,
                        SUM(CASE WHEN status = 'COMPLETE' THEN 1 ELSE 0 END) AS successCount
                     FROM paymentGatewayOrders
                     WHERE vendorSubscriptionId = :vendorSubscriptionId
                       AND orderKind = :orderKind`,
                    {
                        replacements: {
                            vendorSubscriptionId: sub.vendorSubscriptionId,
                            orderKind: ORDER_KIND_SUBSCRIPTION_CHARGE,
                        },
                        type: Sequelize.QueryTypes.SELECT,
                    }
                );
                const failedCount = Number(countRow?.failedCount ?? 0);
                const successCount = Number(countRow?.successCount ?? 0);

                // Charge already succeeded via webhook — clean up the stale grace-period subscription
                if (successCount > 0) {
                    await sequelizeConfig.query(
                        `UPDATE subscriptions
                         SET status = CASE WHEN isCancelled = 1 THEN 'CANCELLED' ELSE 'EXPIRED' END,
                             isGracePeriod = false
                         WHERE id = :id`,
                        { replacements: { id: sub.id }, type: Sequelize.QueryTypes.UPDATE }
                    );
                    customLog(traceId,"info", {
                        message: "subscriptionGracePeriodRetry: charge already succeeded, expired stale subscription",
                        subscriptionId: sub.id,
                    });
                    continue;
                }

                const isPastExpiry = sub.subscriptionEndDate
                    ? moment.utc(sub.subscriptionEndDate).startOf("day").isBefore(moment.utc().startOf("day"))
                    : false;
                if (isPastExpiry || failedCount >= sub.maxRetries) {
                    await expireGraceSubscription(sub, traceId);
                    continue;
                }

                // Retry on the SAME merchant the mandate was created on (merchant-scoped). Defaults to
                // the shared subscriptions merchant; an individual product with its own merchant uses it.
                const merchantAccessKey = await getMerchantAccessKeyForSubscription(sub.vendorSubscriptionId);
                const subCredentials = await resolveMerchantCredentials(merchantAccessKey);
                if (!subCredentials || !subCredentials.clientId || !subCredentials.clientSecret) {
                    customLog(traceId, "error", {
                        message: "subscriptionGracePeriodRetry: Cashfree credentials not found for subscription merchant — skipping",
                        subscriptionId: sub.id,
                        merchantAccessKey,
                    });
                    continue;
                }
                // Which Cashfree merchant this grace retry charges on (per-product merchant for individual
                // subscriptions, else the shared Peko subscriptions merchant). Logged for later debugging.
                customLog(traceId, "info", {
                    message: "subscriptionGracePeriodRetry: resolved merchant",
                    subscriptionId: sub.id,
                    vendorSubscriptionId: sub.vendorSubscriptionId,
                    merchantAccessKey,
                    merchantSource: subCredentials.merchantSource,
                }, "VENDOR");

                // Retrieve charge amount from the most recent order for this subscription
                const [lastOrder] = await sequelizeConfig.query(
                    `SELECT paymentData FROM paymentGatewayOrders
                     WHERE vendorSubscriptionId = :vendorSubscriptionId
                       AND orderKind = :orderKind
                     ORDER BY createdAt DESC
                     LIMIT 1`,
                    {
                        replacements: {
                            vendorSubscriptionId: sub.vendorSubscriptionId,
                            orderKind: ORDER_KIND_SUBSCRIPTION_CHARGE,
                        },
                        type: Sequelize.QueryTypes.SELECT,
                    }
                );
                const parsedPaymentData = lastOrder?.paymentData
                    ? (typeof lastOrder.paymentData === "string" ? JSON.parse(lastOrder.paymentData) : lastOrder.paymentData)
                    : null;
                const amount = parsedPaymentData?.amount;

                if (!amount || amount <= 0) {
                    customLog(traceId, "info", {
                        message: "subscriptionGracePeriodRetry: could not determine charge amount, skipping",
                        subscriptionId: sub.id,
                    });
                    continue;
                }

                const planMaxAmount = String(sub.billingType || "").toUpperCase() === "ANNUALLY" ? 100000 : 14999;
                if (amount > planMaxAmount) {
                    customLog(traceId, "error", {
                        message: "EXCEEDS_MANDATE_CAP: gross renewal amount exceeds the mandate's plan_max_amount — retry skipped, user needs re-mandate or one-time payment",
                        subscriptionId: sub.id,
                        amount,
                        planMaxAmount,
                        billingType: sub.billingType,
                        vendorSubscriptionId: sub.vendorSubscriptionId,
                    }, "VENDOR");
                    continue;
                }

                const referenceNo = `charge_${sub.id}_retry_${today}`;
                const paymentRefId = Date.now();

                // Idempotency — skip if already attempted today
                const [existing] = await sequelizeConfig.query(
                    `SELECT id FROM paymentGatewayOrders
                     WHERE referenceNo = :referenceNo AND orderKind = :orderKind
                     LIMIT 1`,
                    {
                        replacements: { referenceNo, orderKind: ORDER_KIND_SUBSCRIPTION_CHARGE },
                        type: Sequelize.QueryTypes.SELECT,
                    }
                );
                if (existing) {
                    customLog(traceId,"info", {
                        message: "subscriptionGracePeriodRetry: retry already attempted today, skipping",
                        subscriptionId: sub.id,
                    });
                    continue;
                }

                await sequelizeConfig.query(
                    `INSERT INTO paymentGatewayOrders
                       (paymentRefId, referenceNo, vendorSubscriptionId, paymentData, status, orderKind, createdAt, updatedAt)
                     VALUES
                       (:paymentRefId, :referenceNo, :vendorSubscriptionId, :pgPaymentData, 'ORDERED', :orderKind, NOW(), NOW())`,
                    {
                        replacements: {
                            paymentRefId,
                            referenceNo,
                            vendorSubscriptionId: sub.vendorSubscriptionId,
                            pgPaymentData: JSON.stringify({
                                kind: "SUBSCRIPTION_CHARGE",
                                subscriptionId: sub.id,
                                amount,
                                taxableAmount: parsedPaymentData?.taxableAmount,
                                taxAmount: parsedPaymentData?.taxAmount,
                                taxRate: parsedPaymentData?.taxRate,
                                vendorSubscriptionId: sub.vendorSubscriptionId,
                                accessKey: merchantAccessKey,
                            }),
                            orderKind: ORDER_KIND_SUBSCRIPTION_CHARGE,
                        },
                        type: Sequelize.QueryTypes.INSERT,
                    }
                );

                try {
                    customLog(traceId, "info", {
                        message: "[subscription:charge] request",
                        endpoint: "Cashfree /pg/subscriptions/pay (grace retry)",
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
                        url: `${subCredentials.apiUrl}/pg/subscriptions/pay`,
                        headers: {
                            "x-api-version": subCredentials.version,
                            "x-client-id": subCredentials.clientId,
                            "x-client-secret": subCredentials.clientSecret,
                            "Content-Type": "application/json",
                        },
                        data: {
                            subscription_id: sub.vendorSubscriptionId,
                            payment_id: referenceNo,
                            payment_amount: amount,
                            payment_schedule_date: paymentScheduleDate,
                            payment_type: "CHARGE",
                            payment_remarks: `Retry_${sub.packageName}_${sub.billingType}`.replace(/[^a-zA-Z0-9._-]/g, "_"),
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
                                orderKind: ORDER_KIND_SUBSCRIPTION_CHARGE,
                            },
                            type: Sequelize.QueryTypes.UPDATE,
                        }
                    );

                    customLog(traceId,"info", {
                        message: "subscriptionGracePeriodRetry: charge re-triggered successfully",
                        subscriptionId: sub.id,
                        referenceNo,
                        attempt: failedCount + 1,
                        maxRetries: sub.maxRetries,
                    }, "VENDOR");
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
                                orderKind: ORDER_KIND_SUBSCRIPTION_CHARGE,
                            },
                            type: Sequelize.QueryTypes.UPDATE,
                        }
                    );
                    customLog(traceId,"error", {
                        message: "subscriptionGracePeriodRetry: Cashfree charge API call failed",
                        subscriptionId: sub.id,
                        referenceNo,
                        error: errData,
                    }, "VENDOR");
                }
            } catch (subError) {
                customLog(traceId,"error", {
                    message: "subscriptionGracePeriodRetry: unexpected error processing subscription",
                    subscriptionId: sub.id,
                    error: subError?.message ?? subError,
                });
            }
        }

        // WhatsApp grace-period retry — same pattern, separate table.
        const whatsAppGraceSubs = await fetchWhatsAppSubscriptionForAutoRenewalRetry();
        if (whatsAppGraceSubs.length) {
            customLog(traceId, "info", {
                message: `subscriptionGracePeriodRetry: processing ${whatsAppGraceSubs.length} grace-period WhatsApp subscription(s)`,
            });
            // Keep the shared connection (apiUrl + x-api-version) from the base credentials, and replace
            // ONLY clientId/clientSecret with WhatsApp's own merchant creds — strict, no fallback.
            const waClient = await getWhatsAppMerchantClientCreds();
            const waCredentials = (credentials && waClient?.clientId && waClient?.clientSecret)
                ? { ...credentials, clientId: waClient.clientId, clientSecret: waClient.clientSecret }
                : null;
            if (!waCredentials) {
                customLog(traceId, "error", {
                    message: "subscriptionGracePeriodRetry: WhatsApp Cashfree credentials not found — skipping WhatsApp retries",
                });
            } else {
                for (const sub of whatsAppGraceSubs) {
                    try {
                        await processWhatsAppGraceRetry(sub, waCredentials, today, paymentScheduleDate, traceId);
                    } catch (subError) {
                        customLog(traceId, "error", {
                            message: "subscriptionGracePeriodRetry: unexpected error processing WhatsApp subscription",
                            subscriptionId: sub.id,
                            error: subError?.message ?? subError,
                        });
                    }
                }
            }
        }

        // Peko Commerce grace-period retry — same pattern, separate table, no addon complexity.
        const ecomGraceSubs = await fetchEcommerceStoreSubscriptionForAutoRenewalRetry();
        if (ecomGraceSubs.length) {
            customLog(traceId, "info", {
                message: `subscriptionGracePeriodRetry: processing ${ecomGraceSubs.length} grace-period Peko Commerce subscription(s)`,
            });
            for (const sub of ecomGraceSubs) {
                try {
                    await processEcommerceStoreGraceRetry(sub, today, paymentScheduleDate, traceId);
                } catch (subError) {
                    customLog(traceId, "error", {
                        message: "subscriptionGracePeriodRetry: unexpected error processing Peko Commerce subscription",
                        subscriptionId: sub.id,
                        error: subError?.message ?? subError,
                    });
                }
            }
        }

        customLog(traceId,"info", { message: "subscriptionGracePeriodRetry: completed" });
    } catch (error) {
        customLog(traceId,"error", {
            message: "subscriptionGracePeriodRetry: unexpected top-level error",
            error: error?.message ?? error,
        });
    }
};

const processWhatsAppGraceRetry = async (sub, credentials, today, paymentScheduleDate, traceId = null) => {
    // Past charge outcomes for this Cashfree mandate
    const [countRow] = await sequelizeConfig.query(
        `SELECT
            SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) AS failedCount,
            SUM(CASE WHEN status = 'COMPLETE' THEN 1 ELSE 0 END) AS successCount
         FROM paymentGatewayOrders
         WHERE vendorSubscriptionId = :vendorSubscriptionId
           AND orderKind = :orderKind`,
        {
            replacements: {
                vendorSubscriptionId: sub.vendorSubscriptionId,
                orderKind: ORDER_KIND_SUBSCRIPTION_CHARGE,
            },
            type: Sequelize.QueryTypes.SELECT,
        }
    );
    const failedCount = Number(countRow?.failedCount ?? 0);
    const successCount = Number(countRow?.successCount ?? 0);

    // Charge already succeeded via webhook — clear the stale grace flag.
    // (The webhook's renewWhatsAppSubscription has already inserted a fresh row.)
    if (successCount > 0) {
        await clearWhatsAppGraceForMandate(sub.vendorSubscriptionId);
        customLog(traceId, "info", {
            message: "subscriptionGracePeriodRetry: WhatsApp charge already succeeded, cleared grace flag",
            subscriptionId: sub.id,
            vendorSubscriptionId: sub.vendorSubscriptionId,
        });
        return;
    }

    // Past its expiry date, or max retries exhausted — expire main + addon rows.
    // The expiry-date cutoff is the hard stop: retries only run while the plan is still within
    // its paid period, so a charge whose webhook never arrives (order stuck IN_PROGRESS,
    // failedCount never climbing to maxRetries) can't keep the plan ACTIVE past its expiry date
    // forever. successCount is checked above, so a confirmed renewal is never expired here.
    const isPastExpiry = sub.subscriptionEndDate
        ? moment.utc(sub.subscriptionEndDate).startOf("day").isBefore(moment.utc().startOf("day"))
        : false;
    if (isPastExpiry || failedCount >= sub.maxRetries) {
        await expireWhatsAppGraceSubscription(sub, traceId);
        return;
    }

    // Priced fresh, same as the first renewal attempt (whatsAppTriggerSubscriptionCharges)
    const charge = await computeWhatsAppRenewalCharge({
        packageId: sub.packageId,
        billingType: sub.billingType,
        corporateUserId: sub.corporateUserId,
        credentialId: sub.credentialId,
    });
    const amount = charge?.amount;
    if (!amount || amount <= 0) {
        customLog(traceId, "info", {
            message: "subscriptionGracePeriodRetry: WhatsApp zero amount, skipping",
            subscriptionId: sub.id,
        });
        return;
    }

    const referenceNo = `wa_charge_${sub.id}_retry_${today}`;
    const paymentRefId = Date.now();

    // Idempotency
    const [existing] = await sequelizeConfig.query(
        `SELECT id FROM paymentGatewayOrders
         WHERE referenceNo = :referenceNo AND orderKind = :orderKind
         LIMIT 1`,
        {
            replacements: { referenceNo, orderKind: ORDER_KIND_SUBSCRIPTION_CHARGE },
            type: Sequelize.QueryTypes.SELECT,
        }
    );
    if (existing) {
        customLog(traceId, "info", {
            message: "subscriptionGracePeriodRetry: WhatsApp retry already attempted today, skipping",
            subscriptionId: sub.id,
        });
        return;
    }

    await sequelizeConfig.query(
        `INSERT INTO paymentGatewayOrders
           (paymentRefId, referenceNo, vendorSubscriptionId, paymentData, status, orderKind, createdAt, updatedAt)
         VALUES
           (:paymentRefId, :referenceNo, :vendorSubscriptionId, :pgPaymentData, 'ORDERED', :orderKind, NOW(), NOW())`,
        {
            replacements: {
                paymentRefId,
                referenceNo,
                vendorSubscriptionId: sub.vendorSubscriptionId,
                pgPaymentData: JSON.stringify({
                    kind: 'WA_SUBSCRIPTION_CHARGE',
                    subscriptionId: sub.id,
                    vendorSubscriptionId: sub.vendorSubscriptionId,
                    ...charge,
                }),
                orderKind: ORDER_KIND_SUBSCRIPTION_CHARGE,
            },
            type: Sequelize.QueryTypes.INSERT,
        }
    );

    try {
        customLog(traceId, "info", {
            message: "[subscription:charge] request",
            endpoint: "Cashfree /pg/subscriptions/pay (whatsapp grace retry)",
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
                payment_remarks: `Retry_${sub.packageName || 'WhatsApp'}_${sub.billingPlan || ''}_${sub.billingType || ''}`.replace(/[^a-zA-Z0-9._-]/g, "_"),
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
                    orderKind: ORDER_KIND_SUBSCRIPTION_CHARGE,
                },
                type: Sequelize.QueryTypes.UPDATE,
            }
        );

        customLog(traceId, "info", {
            message: "subscriptionGracePeriodRetry: WhatsApp charge re-triggered successfully",
            subscriptionId: sub.id,
            referenceNo,
            attempt: failedCount + 1,
            maxRetries: sub.maxRetries,
        }, "VENDOR");
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
                    orderKind: ORDER_KIND_SUBSCRIPTION_CHARGE,
                },
                type: Sequelize.QueryTypes.UPDATE,
            }
        );
        customLog(traceId, "error", {
            message: "subscriptionGracePeriodRetry: WhatsApp Cashfree charge API call failed",
            subscriptionId: sub.id,
            referenceNo,
            error: errData,
        }, "VENDOR");
    }
};

const clearWhatsAppGraceForMandate = async (vendorSubscriptionId) => {
    await sequelizeConfig.query(
        `UPDATE whatsAppSubscriptions
         SET isGracePeriod = false
         WHERE vendorSubscriptionId = :vendorSubscriptionId
           AND isGracePeriod = true`,
        { replacements: { vendorSubscriptionId }, type: Sequelize.QueryTypes.UPDATE }
    );
};

const expireWhatsAppGraceSubscription = async (sub, traceId = null) => {
    const { id, vendorSubscriptionId, username, packageName, billingPlan, email, name, billingType, subscriptionAmountPaid, registeredBy } = sub;
    try {
        // Retire BOTH main and addon rows tied to this mandate. Per-row status:
        // isCancelled = 1 → 'CANCELLED' (user explicitly cancelled), else 'EXPIRED'.
        await sequelizeConfig.query(
            `UPDATE whatsAppSubscriptions
             SET status = CASE WHEN isCancelled = 1 THEN 'CANCELLED' ELSE 'EXPIRED' END,
                 isGracePeriod = false
             WHERE vendorSubscriptionId = :vendorSubscriptionId
               AND status = 'ACTIVE'`,
            { replacements: { vendorSubscriptionId }, type: Sequelize.QueryTypes.UPDATE }
        );

        await stopWhatsAppProjectBilling(sub.projectId, traceId);

        if (username) {
            await createNotification({
                notificationTitle: "WhatsApp Subscription Expired",
                notificationBrief: `Your ${packageName || 'WhatsApp'} ${billingPlan || ''} subscription has expired after multiple failed renewal attempts. Please update your payment details and resubscribe.`,
                notificationTo: [username],
                notificationCategory: "CORPORATE",
                notificationBy: "ADMIN",
            });
        }

        // Email parity with the in-app expiry notification above. Non-fatal — a mail blip must not
        // prevent the row from being expired (it already is, above).
        if (email) {
            try {
                const planLabel = packageName || `WhatsApp ${billingPlan === 'BASIC' ? 'Basic' : 'Pro'}`;
                const partnerData = registeredBy
                    ? await fetchPartnerDetails(registeredBy)
                    : await partnerLogos();
                const loginUrl = `${frontendBaseUrl}/auth/login`;
                const subject = `Your ${planLabel} subscription has expired`;
                // This fires after retries are exhausted, not from a single charge attempt, so
                // there's no specific decline reason in scope here - generic explanatory text.
                const failedReason = 'We were unable to process your payment after multiple renewal attempts';
                const resolved = await resolveEmailTemplate({
                    key: EMAIL_TEMPLATE_KEYS.SUBSCRIPTION_RENEWAL_FAILURE,
                    service: EMAIL_TEMPLATE_SERVICES.SCHEDULER,
                    variables: {
                        name,
                        packageName: planLabel,
                        billingType: (billingType || 'MONTHLY').toLowerCase(),
                        payableAmount: subscriptionAmountPaid,
                        formattedDate: moment().format('YYYY-MM-DD'),
                        failedReason,
                        loginUrl,
                        branding: partnerData?.branding || 'Peko',
                        website: partnerData?.website || 'https://www.peko.one',
                        ...v2LayoutVariables(partnerData),
                    },
                    fallback: () => generateSubscriptionFailureEmail(
                        name,
                        { packageName: planLabel, billingType: billingType || 'MONTHLY' },
                        subscriptionAmountPaid,
                        partnerData,
                        loginUrl,
                        failedReason,
                    ),
                    fallbackSubject: subject,
                    logTraceId: traceId,
                });
                const emailResult = await emailer.email(email, resolved.subject, resolved.html);
                if (!emailResult?.status) {
                    customLog(traceId, "error", { message: "subscriptionGracePeriodRetry: WhatsApp 'expired' email failed", subscriptionId: id, reason: emailResult?.message });
                }
            } catch (emailErr) {
                customLog(traceId, "error", { message: "subscriptionGracePeriodRetry: threw sending WhatsApp 'expired' email", subscriptionId: id, error: emailErr?.message ?? emailErr });
            }
        }

        customLog(traceId, "info", {
            message: "subscriptionGracePeriodRetry: WhatsApp subscription expired after max retries",
            subscriptionId: id,
            vendorSubscriptionId,
        });
    } catch (error) {
        customLog(traceId, "error", {
            message: "subscriptionGracePeriodRetry: error expiring grace period WhatsApp subscription",
            subscriptionId: id,
            error: error?.message ?? error,
        });
    }
};

const expireGraceSubscription = async (sub, traceId = null) => {
    const { id, corporateUserId, packageType, username, packageName, partnerId } = sub;
    try {
        await sequelizeConfig.query(
            `UPDATE subscriptions
             SET status = CASE WHEN isCancelled = 1 THEN 'CANCELLED' ELSE 'EXPIRED' END,
                 isGracePeriod = false
             WHERE id = :id`,
            { replacements: { id }, type: Sequelize.QueryTypes.UPDATE }
        );

        if (packageType === "GROUP") {
            await sequelizeConfig.query(
                `UPDATE subscriptions SET status = 'ACTIVE'
                 WHERE corporateUserId = :corporateUserId AND subscriptionPaymentRefId IS NULL`,
                { replacements: { corporateUserId }, type: Sequelize.QueryTypes.UPDATE }
            );

            const [packageBasic] = await sequelizeConfig.query(
                `SELECT id FROM packages
                 WHERE packageType = 'GROUP'
                   AND (partnerId = :partnerId OR (:partnerId IS NULL AND partnerId IS NULL))
                   AND status = true
                 ORDER BY priorityLevel ASC
                 LIMIT 1`,
                { replacements: { partnerId: partnerId ?? null }, type: Sequelize.QueryTypes.SELECT }
            );

            if (packageBasic) {
                await sequelizeConfig.query(
                    `UPDATE corporateUsers SET packageId = :packageId WHERE id = :corporateUserId`,
                    { replacements: { packageId: packageBasic.id, corporateUserId }, type: Sequelize.QueryTypes.UPDATE }
                );
            } else {
                customLog(traceId, "error", { message: "expireGraceSubscription: no basic GROUP package found — skipping packageId update", corporateUserId, partnerId });
            }

            // Retire all time-bound addons (payroll etc.) — they cannot be renewed without an active
            // main plan and there is no orphan-addon renewal mechanism. Per-row status follows the
            // same rule: isCancelled = 1 → 'CANCELLED', else 'EXPIRED'.
            // Permanent one-time addons (eSign, Garage — subscriptionEndDate=null) are left ACTIVE.
            await sequelizeConfig.query(
                `UPDATE subscriptions
                 SET status = CASE WHEN isCancelled = 1 THEN 'CANCELLED' ELSE 'EXPIRED' END
                 WHERE corporateUserId = :corporateUserId
                   AND isCustom = 1
                   AND status = 'ACTIVE'
                   AND subscriptionEndDate IS NOT NULL`,
                { replacements: { corporateUserId }, type: Sequelize.QueryTypes.UPDATE }
            );
        }

        if (packageType === "INDIVIDUAL") {
            // Retire this individual base's OWN addons (scoped by packageId) so a failed-renewal
            // individual base doesn't leave its addons ACTIVE. All individual addons are time-bound
            // (monthly/annual). Per-row status: isCancelled=1 → CANCELLED, else EXPIRED.
            await sequelizeConfig.query(
                `UPDATE subscriptions
                 SET status = CASE WHEN isCancelled = 1 THEN 'CANCELLED' ELSE 'EXPIRED' END
                 WHERE corporateUserId = :corporateUserId
                   AND packageId = :packageId
                   AND isCustom = 1
                   AND status = 'ACTIVE'`,
                { replacements: { corporateUserId, packageId: sub.packageId }, type: Sequelize.QueryTypes.UPDATE }
            );
        }

        if (username) {
            // Only GROUP expiry downgrades the account to the basic plan; an INDIVIDUAL base simply
            // lapses (its addons are retired above), so don't tell those users they were moved to basic.
            const notificationBrief =
                packageType === "GROUP"
                    ? `Your ${packageName} subscription has expired after multiple failed renewal attempts. You have been moved to the basic plan. Please update your payment details and resubscribe.`
                    : `Your ${packageName} subscription has expired after multiple failed renewal attempts. Please update your payment details and resubscribe.`;
            await createNotification({
                notificationTitle: "Subscription Expired",
                notificationBrief,
                notificationTo: [username],
                notificationCategory: "CORPORATE",
                notificationBy: "ADMIN",
            });
        }

        customLog(traceId,"info", {
            message: "subscriptionGracePeriodRetry: subscription expired after max retries",
            subscriptionId: id,
            corporateUserId,
        });
    } catch (error) {
        customLog(traceId,"error", {
            message: "subscriptionGracePeriodRetry: error expiring grace period subscription",
            subscriptionId: id,
            error: error?.message ?? error,
        });
    }
};

const processEcommerceStoreGraceRetry = async (sub, today, paymentScheduleDate, traceId = null) => {
    // Past charge outcomes for this Cashfree mandate
    const [countRow] = await sequelizeConfig.query(
        `SELECT
            SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) AS failedCount,
            SUM(CASE WHEN status = 'COMPLETE' THEN 1 ELSE 0 END) AS successCount
         FROM paymentGatewayOrders
         WHERE vendorSubscriptionId = :vendorSubscriptionId
           AND orderKind = :orderKind`,
        {
            replacements: {
                vendorSubscriptionId: sub.vendorSubscriptionId,
                orderKind: ORDER_KIND_SUBSCRIPTION_CHARGE,
            },
            type: Sequelize.QueryTypes.SELECT,
        }
    );
    const failedCount = Number(countRow?.failedCount ?? 0);
    const successCount = Number(countRow?.successCount ?? 0);

    // Already succeeded via webhook — clear the stale grace flag.
    if (successCount > 0) {
        await sequelizeConfig.query(
            `UPDATE serviceSubscriptions
             SET isGracePeriod = false
             WHERE vendorSubscriptionId = :vendorSubscriptionId
               AND isGracePeriod = true`,
            { replacements: { vendorSubscriptionId: sub.vendorSubscriptionId }, type: Sequelize.QueryTypes.UPDATE }
        );
        customLog(traceId, "info", {
            message: "subscriptionGracePeriodRetry: Peko Commerce charge already succeeded, cleared grace flag",
            subscriptionId: sub.id,
            vendorSubscriptionId: sub.vendorSubscriptionId,
        });
        return;
    }

    // Past its expiry date, or max retries exhausted — expire.
    const isPastExpiry = sub.subscriptionEndDate
        ? moment.utc(sub.subscriptionEndDate).startOf("day").isBefore(moment.utc().startOf("day"))
        : false;
    if (isPastExpiry || failedCount >= sub.maxRetries) {
        await expireEcommerceStoreGraceSubscription(sub, traceId);
        return;
    }

    const [lastOrder] = await sequelizeConfig.query(
        `SELECT paymentData FROM paymentGatewayOrders
         WHERE vendorSubscriptionId = :vendorSubscriptionId
           AND orderKind = :orderKind
         ORDER BY createdAt DESC
         LIMIT 1`,
        {
            replacements: { vendorSubscriptionId: sub.vendorSubscriptionId, orderKind: ORDER_KIND_SUBSCRIPTION_CHARGE },
            type: Sequelize.QueryTypes.SELECT,
        }
    );
    const parsedPaymentData = lastOrder?.paymentData
        ? (typeof lastOrder.paymentData === "string" ? JSON.parse(lastOrder.paymentData) : lastOrder.paymentData)
        : null;
    const amount = parseFloat(parsedPaymentData?.amount);
    if (!amount || amount <= 0) {
        customLog(traceId, "info", {
            message: "subscriptionGracePeriodRetry: Peko Commerce could not determine charge amount, skipping",
            subscriptionId: sub.id,
        });
        return;
    }

    // Retry on the same merchant the mandate was created on.
    const merchantAccessKey = await getMerchantAccessKeyForSubscription(sub.vendorSubscriptionId);
    const credentials = await resolveMerchantCredentials(merchantAccessKey);
    if (!credentials || !credentials.clientId || !credentials.clientSecret) {
        customLog(traceId, "error", {
            message: "subscriptionGracePeriodRetry: Cashfree credentials not found for Peko Commerce merchant — skipping",
            subscriptionId: sub.id,
            merchantAccessKey,
        });
        return;
    }

    const referenceNo = `ecom_charge_${sub.id}_retry_${today}`;
    const paymentRefId = Date.now();

    // Idempotency
    const [existing] = await sequelizeConfig.query(
        `SELECT id FROM paymentGatewayOrders
         WHERE referenceNo = :referenceNo AND orderKind = :orderKind
         LIMIT 1`,
        {
            replacements: { referenceNo, orderKind: ORDER_KIND_SUBSCRIPTION_CHARGE },
            type: Sequelize.QueryTypes.SELECT,
        }
    );
    if (existing) {
        customLog(traceId, "info", {
            message: "subscriptionGracePeriodRetry: Peko Commerce retry already attempted today, skipping",
            subscriptionId: sub.id,
        });
        return;
    }

    await sequelizeConfig.query(
        `INSERT INTO paymentGatewayOrders
           (paymentRefId, referenceNo, vendorSubscriptionId, paymentData, status, orderKind, createdAt, updatedAt)
         VALUES
           (:paymentRefId, :referenceNo, :vendorSubscriptionId, :pgPaymentData, 'ORDERED', :orderKind, NOW(), NOW())`,
        {
            replacements: {
                paymentRefId,
                referenceNo,
                vendorSubscriptionId: sub.vendorSubscriptionId,
                pgPaymentData: JSON.stringify({
                    kind: 'ECOMMERCE_STORE_SUBSCRIPTION_CHARGE',
                    subscriptionId: sub.id,
                    amount,
                    listPrice: parsedPaymentData?.listPrice,
                    discountAmount: parsedPaymentData?.discountAmount,
                    vendorSubscriptionId: sub.vendorSubscriptionId,
                    accessKey: merchantAccessKey,
                }),
                orderKind: ORDER_KIND_SUBSCRIPTION_CHARGE,
            },
            type: Sequelize.QueryTypes.INSERT,
        }
    );

    try {
        customLog(traceId, "info", {
            message: "[subscription:charge] request",
            endpoint: "Cashfree /pg/subscriptions/pay (ecommerce_store grace retry)",
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
                payment_remarks: `Retry_${sub.packageName || 'PekoCommerce'}_${sub.billingType || ''}`.replace(/[^a-zA-Z0-9._-]/g, "_"),
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
                    orderKind: ORDER_KIND_SUBSCRIPTION_CHARGE,
                },
                type: Sequelize.QueryTypes.UPDATE,
            }
        );

        customLog(traceId, "info", {
            message: "subscriptionGracePeriodRetry: Peko Commerce charge re-triggered successfully",
            subscriptionId: sub.id,
            referenceNo,
            attempt: failedCount + 1,
            maxRetries: sub.maxRetries,
        }, "VENDOR");
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
                    orderKind: ORDER_KIND_SUBSCRIPTION_CHARGE,
                },
                type: Sequelize.QueryTypes.UPDATE,
            }
        );
        customLog(traceId, "error", {
            message: "subscriptionGracePeriodRetry: Peko Commerce Cashfree charge API call failed",
            subscriptionId: sub.id,
            referenceNo,
            error: errData,
        }, "VENDOR");
    }
};

const expireEcommerceStoreGraceSubscription = async (sub, traceId = null) => {
    const { id, vendorSubscriptionId, username, packageName, email, name, billingType, subscriptionAmountPaid } = sub;
    try {
        await sequelizeConfig.query(
            `UPDATE serviceSubscriptions
             SET status = CASE WHEN isCancelled = 1 THEN 'CANCELLED' ELSE 'EXPIRED' END,
                 isGracePeriod = false
             WHERE vendorSubscriptionId = :vendorSubscriptionId
               AND status = 'ACTIVE'`,
            { replacements: { vendorSubscriptionId }, type: Sequelize.QueryTypes.UPDATE }
        );

        if (username) {
            await createNotification({
                notificationTitle: "Subscription Expired",
                notificationBrief: `Your Peko Commerce ${packageName || ''} subscription has expired after multiple failed renewal attempts. Please update your payment details and resubscribe.`,
                notificationTo: [username],
                notificationCategory: "CORPORATE",
                notificationBy: "ADMIN",
            });
        }

        // Non-fatal — row is already expired above.
        if (email) {
            try {
                const emailResult = await emailer.email(
                    email,
                    `Your Peko Commerce ${packageName || ''} subscription has expired`,
                    generateSubscriptionFailureEmail(
                        name,
                        { packageName: packageName || 'Peko Commerce', billingType: billingType || 'MONTHLY' },
                        subscriptionAmountPaid,
                    ),
                );
                if (!emailResult?.status) {
                    customLog(traceId, "error", { message: "subscriptionGracePeriodRetry: Peko Commerce 'expired' email failed", subscriptionId: id, reason: emailResult?.message });
                }
            } catch (emailErr) {
                customLog(traceId, "error", { message: "subscriptionGracePeriodRetry: threw sending Peko Commerce 'expired' email", subscriptionId: id, error: emailErr?.message ?? emailErr });
            }
        }

        customLog(traceId, "info", {
            message: "subscriptionGracePeriodRetry: Peko Commerce subscription expired after max retries",
            subscriptionId: id,
            vendorSubscriptionId,
        });
    } catch (error) {
        customLog(traceId, "error", {
            message: "subscriptionGracePeriodRetry: error expiring grace period Peko Commerce subscription",
            subscriptionId: id,
            error: error?.message ?? error,
        });
    }
};
