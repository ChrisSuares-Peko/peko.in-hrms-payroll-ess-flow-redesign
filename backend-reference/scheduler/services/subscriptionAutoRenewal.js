const Sequelize = require("sequelize");
const sequelizeConfig = require("../configs/database/index");
const moment = require('moment');
const { customLog } = require("../utils/loggerHelper");
const { createNotification } = require('../models/use-cases/notification');
const emailer = require("../utils/email/emailer");
const { generateSubscriptionFailureEmail, generateSubscriptionCancelledEmail } = require("../utils/emailTemplates");
const { stopWhatsAppProjectBilling } = require("../utils/whatsappProjectBilling");
const { v4: uuidv4 } = require("uuid");
const { partnerLogos } = require("../utils/partnerLogos");
const { fetchPartnerDetails } = require("../models/use-cases/systemUser");
const { resolveEmailTemplate } = require("./emailTemplateResolver");
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require("../utils/emailTemplateKeys");
const { v2LayoutVariables } = require("../utils/emailTemplate/sharedLayout");

const frontendBaseUrl = process.env.NODE_ENV === "production" ? process.env.PRODUCTION_URL : process.env.FRONTEND_STAGING_URL;

exports.subscriptionAutoRenewal = async () => {
    // One correlation id per cron run, threaded through every customLog in this job (incl. helpers).
    const traceId = uuidv4();
    try {
        const yesterday = moment.utc().subtract(1, 'days').format('YYYY-MM-DD')
        const today = moment.utc().format('YYYY-MM-DD');

        const query = `
               SELECT
                   subscriptions.*,
                    corporateUsers.name,
                    corporateUsers.email,
                    corporateUsers.city,
                    credentials.username,
                    credentials.registeredBy,
                    packages.packageName,
                    packages.packageType,
                    packages.partnerId,
                    packages.packagePrices,
                    packages.discount
               FROM
                   subscriptions
               JOIN
                   corporateUsers ON subscriptions.corporateUserId = corporateUsers.id
               JOIN
                   credentials ON corporateUsers.credentialId = credentials.id
                JOIN
                   packages ON subscriptions.packageId = packages.id
               WHERE
                   subscriptions.status = 'ACTIVE' AND
                   subscriptions.isCustom = 0 AND
                   (subscriptions.subscriptionPaymentRefId IS NOT NULL OR subscriptions.vendorSubscriptionId IS NOT NULL)
                   AND DATE(subscriptions.subscriptionEndDate) <= :yesterday
                   AND subscriptions.isGracePeriod = false
               `;

        const activeSubscriptions = await sequelizeConfig.query(query, {
            replacements: { yesterday },
            type: Sequelize.QueryTypes.SELECT,
        });
        if (activeSubscriptions.length == 0) return

        for (const subscription of activeSubscriptions) {
            const { id, corporateUserId, isCustom, isCancelled, packageType, username, packageName, partnerId } = subscription

            if (isCustom && isCancelled) {
                await updateSubscriptionStatus(id, 'CANCELLED')
                continue
            }
            if (isCancelled) {
                await handleCancelledSubscription(subscription, traceId)
                continue
            }

            // Expire deterministically at endDate+1 (mirrors the WhatsApp base pass below). A lost/late
            // SUCCESS charge webhook must never keep a sub ACTIVE-but-unpaid: the charge fires ~2 days
            // before expiry, so by the day after endDate its success window has elapsed. A TIMELY
            // renewal already created the PENDING successor, which the newerSub failsafe below detects
            // so this row is expired without downgrading; a lost/late SUCCESS webhook re-creates the
            // cycle back-dated in createSubscription (findExpiredBasePredecessor). FAILED-webhook rows
            // carry isGracePeriod=true and are excluded by the main query (owned by grace-retry).
            await updateSubscriptionStatus(id, 'EXPIRED')

            // Check if a renewal already created a newer active paid subscription.
            // For Cashfree auto-renewals the new subscription is inserted before this job
            // runs, so we must not downgrade or notify those users.
            // Check for any newer paid subscription (same plan renewal OR upgrade to a different plan).
            // Must include PENDING so a renewal created 2 days early by the charge trigger is found.
            const [newerSub] = await sequelizeConfig.query(
                `SELECT id FROM subscriptions
                 WHERE corporateUserId = :corporateUserId
                   AND isCustom = 0
                   AND status IN ('ACTIVE', 'PENDING')
                   AND subscriptionPaymentRefId IS NOT NULL
                   AND id != :id
                 LIMIT 1`,
                {
                    replacements: { corporateUserId, id },
                    type: Sequelize.QueryTypes.SELECT,
                }
            )

            if (!newerSub) {
                if (packageType === 'GROUP') {
                    await updateSubscriptionToBasic(corporateUserId, partnerId, traceId)
                }
                if (username) {
                    await createNotification({
                        notificationTitle: 'Subscription Expired',
                        notificationBrief: `Your ${packageName} subscription has expired. You have been moved to the basic plan.`,
                        notificationTo: [username],
                        notificationCategory: 'CORPORATE',
                        notificationBy: 'ADMIN',
                    })
                }
            }
        }

        // Standalone addon expiry.
        // Under the new addon end-date policy, addons can expire BEFORE the parent GROUP plan
        // (e.g. 30-day addon bought while on Peko Free). This pass flips them to EXPIRED so they
        // stop appearing as ACTIVE in access checks.
        //
        // Filters:
        //   - isCustom = 1                       → addon rows only
        //   - subscriptionEndDate <= yesterday    → fully past their end date
        //   - subscriptionEndDate IS NOT NULL     → leave legacy NULL/lifetime rows alone (defensive
        //                                            for accounts not yet migrated to the new policy)
        //   - isGracePeriod = false               → mandate grace retry should not be force-expired
        const expiredAddonsQuery = `
            SELECT
                subscriptions.id,
                subscriptions.isCancelled,
                credentials.username,
                packages.packageName
            FROM
                subscriptions
            LEFT JOIN
                corporateUsers ON subscriptions.corporateUserId = corporateUsers.id
            LEFT JOIN
                credentials ON corporateUsers.credentialId = credentials.id
            LEFT JOIN
                packages ON subscriptions.packageId = packages.id
            WHERE
                subscriptions.status = 'ACTIVE'
                AND subscriptions.isCustom = 1
                AND subscriptions.subscriptionEndDate IS NOT NULL
                AND DATE(subscriptions.subscriptionEndDate) <= :yesterday
                AND subscriptions.isGracePeriod = false
        `;

        const expiredAddons = await sequelizeConfig.query(expiredAddonsQuery, {
            replacements: { yesterday },
            type: Sequelize.QueryTypes.SELECT,
        });

        for (const addon of expiredAddons) {
            await updateSubscriptionStatus(addon.id, addon.isCancelled ? 'CANCELLED' : 'EXPIRED');
            if (addon.username) {
                await createNotification({
                    notificationTitle: 'Add-on Expired',
                    notificationBrief: `Your ${addon.packageName ?? 'add-on'} subscription has expired. Renew or re-purchase to continue using it.`,
                    notificationTo: [addon.username],
                    notificationCategory: 'CORPORATE',
                    notificationBy: 'ADMIN',
                });
            }
        }

        // Standalone WhatsApp addon expiry (whatsAppSubscriptions table).
        // Mirrors the addon pass above, but for WhatsApp addons (isCustom = 1): no other scheduled job
        // transitions a cancelled/expired WhatsApp addon off ACTIVE, so they were left ACTIVE indefinitely
        // after their end date. Per-row status: isCancelled = 1 → 'CANCELLED', else 'EXPIRED'.
        //   - Base WhatsApp subs (isCustom = 0) are intentionally excluded — their lifecycle is owned by the
        //     Cashfree charge + grace-retry flow (triggerWhatsAppSubscriptionCharges / subscriptionGracePeriodRetry).
        //   - subscriptionEndDate IS NOT NULL leaves legacy lifetime rows alone.
        // Grace rows are NOT excluded here: an addon this far past its own end date wasn't renewed (a
        // successful renewal recreates it as a fresh row), so expire it deterministically — same rationale as
        // the base pass below. This also stops a lapsed grace addon from sitting ACTIVE if the grace-retry
        // flow never resolves it (e.g. its retry setting is unset).
        const expiredWhatsAppAddons = await sequelizeConfig.query(
            `SELECT id, isCancelled FROM whatsAppSubscriptions
             WHERE status = 'ACTIVE'
               AND isCustom = 1
               AND subscriptionEndDate IS NOT NULL
               AND DATE(subscriptionEndDate) <= :yesterday`,
            { replacements: { yesterday }, type: Sequelize.QueryTypes.SELECT }
        );

        for (const addon of expiredWhatsAppAddons) {
            await sequelizeConfig.query(
                `UPDATE whatsAppSubscriptions
                 SET status = CASE WHEN isCancelled = 1 THEN 'CANCELLED' ELSE 'EXPIRED' END
                 WHERE id = :id`,
                { replacements: { id: addon.id }, type: Sequelize.QueryTypes.UPDATE }
            );
        }

        if (expiredWhatsAppAddons.length) {
            customLog(traceId, "info", {
                message: "subscriptionAutoRenewal: transitioned stranded WhatsApp addons off ACTIVE",
                count: expiredWhatsAppAddons.length,
                ids: expiredWhatsAppAddons.map((a) => a.id),
            });
        }

        // Paid base WhatsApp subscriptions that lapsed without a successful Cashfree renewal.
        //   - isCustom = 0                          → base plans only
        //   - subscriptionPaymentRefId IS NOT NULL  → PAID only; excludes the free WhatsApp BASIC row
        //                                             bundled with Peko+ (that row carries NULL and is
        //                                             owned by the Peko+ lifecycle, not this pass)
        //   - subscriptionEndDate <= yesterday      → the day AFTER its end date onward
        // renewWhatsAppSubscription EXPIRES the old row when it creates the renewal, so a still-ACTIVE paid
        // row this far past its end date means no renewal landed — expire it. We deliberately do NOT skip
        // isGracePeriod rows or rows with an in-flight ORDERED/IN_PROGRESS charge: the renewal charge fires
        // 2 days BEFORE endDate, so by the day after endDate its success-webhook window has already elapsed.
        // Expiring unconditionally here makes lapse deterministic and removes the dependency on
        // subscriptionGracePeriodRetry (which no-ops when the retry setting is unset), so a lapsed paid plan
        // can never sit ACTIVE past expiry. A rare late success webhook after this finds no ACTIVE row and is
        // flagged FAILED-for-review by the CHARGE handler, not silently lost.
        const expiredWhatsAppBaseSubs = await sequelizeConfig.query(
            `SELECT ws.id, ws.isCancelled, ws.vendorSubscriptionId, ws.projectId,
                    ws.billingPlan, ws.billingType, ws.subscriptionEndDate, ws.subscriptionAmountPaid,
                    cu.email, cu.name AS corporateName, cu.registeredBy, cr.username
             FROM whatsAppSubscriptions ws
             LEFT JOIN corporateUsers cu ON cu.id = ws.corporateUserId
             LEFT JOIN credentials cr ON cr.id = ws.credentialId
             WHERE ws.status = 'ACTIVE'
               AND ws.isCustom = 0
               AND ws.subscriptionPaymentRefId IS NOT NULL
               AND ws.subscriptionEndDate IS NOT NULL
               AND DATE(ws.subscriptionEndDate) <= :yesterday`,
            { replacements: { yesterday }, type: Sequelize.QueryTypes.SELECT }
        );

        for (const sub of expiredWhatsAppBaseSubs) {
            await sequelizeConfig.query(
                `UPDATE whatsAppSubscriptions
                 SET status = CASE WHEN isCancelled = 1 THEN 'CANCELLED' ELSE 'EXPIRED' END,
                     isGracePeriod = false
                 WHERE id = :id`,
                { replacements: { id: sub.id }, type: Sequelize.QueryTypes.UPDATE }
            );
            customLog(traceId, "info", { message: "subscriptionAutoRenewal: transitioned lapsed paid WhatsApp base sub off ACTIVE", subscriptionId: sub.id, status: sub.isCancelled ? "CANCELLED" : "EXPIRED" });

            // The base plan has terminally lapsed (renewal never landed) — stop AiSensy project billing so
            // Peko isn't billed for a project the customer no longer pays for. Best-effort: the row is already
            // retired above; a vendor hiccup must not abort the expiry pass. (A user-cancelled row already had
            // billing stopped at cancel time, so this is a harmless no-op for that case.)
            await stopWhatsAppProjectBilling(sub.projectId, traceId);

            // End-of-cycle messaging (mirrors the Peko model). A user-cancelled row stayed ACTIVE until
            // now and just became CANCELLED → send the cancellation confirmation. A row that simply lapsed
            // (no successful renewal) became EXPIRED → send the expiry notice. Non-fatal: a messaging blip
            // must not abort the expiry pass.
            const planLabel = `WhatsApp ${sub.billingPlan === 'BASIC' ? 'Basic' : 'Pro'}`;
            const accessEnd = sub.subscriptionEndDate ? moment(sub.subscriptionEndDate).format('MMMM D, YYYY') : null;
            if (sub.isCancelled) {
                if (sub.username) {
                    try {
                        await createNotification({
                            notificationTitle: `Your ${planLabel} Subscription Has Been Cancelled`,
                            notificationBrief: accessEnd
                                ? `Your ${planLabel} subscription has been cancelled. Your access ended on ${accessEnd}. You can re-subscribe anytime via Peko.`
                                : `Your ${planLabel} subscription has been cancelled. You can re-subscribe anytime via Peko.`,
                            notificationTo: [sub.username],
                            notificationCategory: 'CORPORATE',
                            notificationBy: 'ADMIN',
                        });
                    } catch (notifErr) {
                        customLog(traceId, 'error', { message: "subscriptionAutoRenewal: WhatsApp 'cancelled' notification failed", subscriptionId: sub.id, error: notifErr?.message ?? notifErr });
                    }
                }
                if (sub.email) {
                    try {
                        const partnerData = sub.registeredBy
                            ? await fetchPartnerDetails(sub.registeredBy)
                            : await partnerLogos();
                        const subject = `Your ${planLabel} subscription has been cancelled`;
                        // Pre-rendered blob, not a bare ${endDate} placeholder - accessEnd can
                        // legitimately be null (no subscriptionEndDate on the row), and an empty
                        // placeholder would discard the whole admin-stored template.
                        const accessLineHtml = accessEnd
                            ? `Your ${planLabel} subscription was active until ${accessEnd} and has now been cancelled.`
                            : `Your ${planLabel} subscription has been cancelled.`;
                        const resolved = await resolveEmailTemplate({
                            key: EMAIL_TEMPLATE_KEYS.SUBSCRIPTION_CANCELLED,
                            service: EMAIL_TEMPLATE_SERVICES.SCHEDULER,
                            variables: {
                                corporateName: sub.corporateName || 'there',
                                packageName: planLabel,
                                accessLineHtml,
                                branding: partnerData?.branding || 'Peko',
                                website: partnerData?.website || 'https://www.peko.one',
                                ...v2LayoutVariables(partnerData),
                            },
                            fallback: () => generateSubscriptionCancelledEmail({ corporateName: sub.corporateName, packageName: planLabel, endDate: accessEnd, partnerDetails: partnerData }),
                            fallbackSubject: subject,
                        });
                        const emailResult = await emailer.email(sub.email, resolved.subject, resolved.html);
                        if (!emailResult?.status) {
                            customLog(traceId, 'error', { message: "subscriptionAutoRenewal: WhatsApp 'cancelled' email failed", subscriptionId: sub.id, reason: emailResult?.message });
                        }
                    } catch (emailErr) {
                        customLog(traceId, 'error', { message: "subscriptionAutoRenewal: threw sending WhatsApp 'cancelled' email", subscriptionId: sub.id, error: emailErr?.message ?? emailErr });
                    }
                }
            } else {
                if (sub.username) {
                    try {
                        await createNotification({
                            notificationTitle: 'WhatsApp Subscription Expired',
                            notificationBrief: `Your ${planLabel} subscription has expired as the renewal could not be completed. Please resubscribe to continue using the service.`,
                            notificationTo: [sub.username],
                            notificationCategory: 'CORPORATE',
                            notificationBy: 'ADMIN',
                        });
                    } catch (notifErr) {
                        customLog(traceId, 'error', { message: "subscriptionAutoRenewal: WhatsApp 'expired' notification failed", subscriptionId: sub.id, error: notifErr?.message ?? notifErr });
                    }
                }
                if (sub.email) {
                    try {
                        const partnerData = sub.registeredBy
                            ? await fetchPartnerDetails(sub.registeredBy)
                            : await partnerLogos();
                        const loginUrl = `${frontendBaseUrl}/auth/login`;
                        const subject = `Your ${planLabel} subscription has expired`;
                        // This fires on a cron sweep for lapsed subs where renewal never landed - no
                        // specific decline reason is captured at this point, so use generic text.
                        const failedReason = 'We were unable to process your subscription renewal payment';
                        const resolved = await resolveEmailTemplate({
                            key: EMAIL_TEMPLATE_KEYS.SUBSCRIPTION_RENEWAL_FAILURE,
                            service: EMAIL_TEMPLATE_SERVICES.SCHEDULER,
                            variables: {
                                name: sub.corporateName,
                                packageName: planLabel,
                                billingType: (sub.billingType || '').toLowerCase(),
                                payableAmount: sub.subscriptionAmountPaid,
                                formattedDate: moment().format('YYYY-MM-DD'),
                                failedReason,
                                loginUrl,
                                branding: partnerData?.branding || 'Peko',
                                website: partnerData?.website || 'https://www.peko.one',
                                ...v2LayoutVariables(partnerData),
                            },
                            fallback: () => generateSubscriptionFailureEmail(
                                sub.corporateName,
                                { packageName: planLabel, billingType: sub.billingType },
                                sub.subscriptionAmountPaid,
                                partnerData,
                                loginUrl,
                                failedReason,
                            ),
                            fallbackSubject: subject,
                            logTraceId: traceId,
                        });
                        const emailResult = await emailer.email(sub.email, resolved.subject, resolved.html);
                        if (!emailResult?.status) {
                            customLog(traceId, 'error', { message: "subscriptionAutoRenewal: WhatsApp 'expired' email failed", subscriptionId: sub.id, reason: emailResult?.message });
                        }
                    } catch (emailErr) {
                        customLog(traceId, 'error', { message: "subscriptionAutoRenewal: threw sending WhatsApp 'expired' email", subscriptionId: sub.id, error: emailErr?.message ?? emailErr });
                    }
                }
            }
        }

        // Activate subscriptions whose start date has arrived.
        // Use <= (not exact =) so activation is self-healing: if a daily run is missed/delayed, or
        // the start date was computed in a different timezone than this job's UTC `today`
        // (createSubscription sets subscriptionStartDate via server-local moment(); this job uses
        // moment.utc()), the row still activates on the next run instead of being stranded PENDING
        // forever. Safe against overlap: the expiry pass above already retired any predecessor past
        // its end date, and a renewal successor's startDate is always predecessorEnd + 1 day — so a
        // matched PENDING row never coincides with a still-valid ACTIVE predecessor.
        const pendingQuery = `
            SELECT id
            FROM subscriptions
            WHERE status = 'PENDING'
              AND isCancelled = false
              AND DATE(subscriptionStartDate) <= :today
        `;

        const pendingSubscriptions = await sequelizeConfig.query(pendingQuery, {
            replacements: { today },
            type: Sequelize.QueryTypes.SELECT,
        });

        for (const { id } of pendingSubscriptions) {
            await updateSubscriptionStatus(id, 'ACTIVE');
            // Safety net: ensure corporateUsers.packageId reflects the newly activated plan.
            // createSubscription sets this at creation time, but if that update failed mid-transaction
            // the PENDING row would exist without the packageId being updated.
            const [sub] = await sequelizeConfig.query(
                `SELECT s.corporateUserId, s.packageId, p.packageType
                 FROM subscriptions s JOIN packages p ON s.packageId = p.id
                 WHERE s.id = :id`,
                { replacements: { id }, type: Sequelize.QueryTypes.SELECT }
            );
            if (sub && sub.packageType === 'GROUP') {
                await sequelizeConfig.query(
                    `UPDATE corporateUsers SET packageId = :packageId WHERE id = :corporateUserId`,
                    { replacements: { packageId: sub.packageId, corporateUserId: sub.corporateUserId }, type: Sequelize.QueryTypes.UPDATE }
                );
            }
        }


    } catch (error) {
        customLog(traceId, "error", { message:"Error in auto pay for subscription", error })
    }
};

const updateSubscriptionStatus = async (id, status) => {
    const updateQuery = `
      UPDATE subscriptions
      SET status = :status
      WHERE id = :id
      `;
    await sequelizeConfig.query(updateQuery, {
        replacements: { id, status },
        type: Sequelize.QueryTypes.UPDATE,
    });
};
const handleCancelledSubscription = async (subscription, traceId = null) => {
    const { id: subscriptionId, packageType, corporateUserId: corporateId, partnerId } = subscription;
    if (!corporateId) {
        customLog(traceId, "error", { message: "handleCancelledSubscription called with null/undefined corporateId — skipping", subscriptionId });
        return false;
    }
    const status = 'CANCELLED';

    // Start a transaction
    const transaction = await sequelizeConfig.transaction();
    try {
        const updateQuery = `
            UPDATE subscriptions
            SET status = :status
            WHERE id = :subscriptionId
        `;
        await sequelizeConfig.query(updateQuery, {
            replacements: { subscriptionId, status },
            type: Sequelize.QueryTypes.UPDATE,
            transaction,
        });

        if (packageType === 'GROUP') {
            // Activate the basic (free) subscription
            const activateBasicQuery = `
                UPDATE subscriptions
                SET status = 'ACTIVE'
                WHERE corporateUserId = :corporateId
                  AND subscriptionPaymentRefId IS NULL
            `;
            await sequelizeConfig.query(activateBasicQuery, {
                replacements: { corporateId },
                type: Sequelize.QueryTypes.UPDATE,
                transaction,
            });

            // Fetch the basic package with the lowest priority for GROUP
            const fetchBasicPackageQuery = `
                 SELECT id
                 FROM packages
                 WHERE packageType = 'GROUP'
                   AND (partnerId = :partnerId OR (:partnerId IS NULL AND partnerId IS NULL))
                   AND status = true
                 ORDER BY priorityLevel ASC
                 LIMIT 1
            `;
            const [packageBasic] = await sequelizeConfig.query(fetchBasicPackageQuery, {
                replacements: { partnerId },
                type: Sequelize.QueryTypes.SELECT,
                transaction,
            });

            if (!packageBasic) {
                customLog(traceId, "error", { message: "handleCancelledSubscription: no basic GROUP package found — skipping packageId update", corporateId, partnerId });
            } else {
                const updateCorporateUserQuery = `
                    UPDATE corporateUsers
                    SET packageId = :packageId
                    WHERE id = :corporateId
                `;
                await sequelizeConfig.query(updateCorporateUserQuery, {
                    replacements: { packageId: packageBasic.id, corporateId },
                    type: Sequelize.QueryTypes.UPDATE,
                    transaction,
                });
            }

            // Retire all time-bound addons under the cancelled main plan. Per-row status:
            // - isCancelled = 1 → 'CANCELLED' (user explicitly cancelled the addon earlier)
            // - isCancelled = 0 → 'EXPIRED'  (addon is being retired because the main plan ended)
            // Permanent one-time addons (subscriptionEndDate=null) are intentionally left ACTIVE.
            await sequelizeConfig.query(
                `UPDATE subscriptions
                 SET status = CASE WHEN isCancelled = 1 THEN 'CANCELLED' ELSE 'EXPIRED' END
                 WHERE corporateUserId = :corporateId
                   AND isCustom = 1
                   AND status = 'ACTIVE'
                   AND subscriptionEndDate IS NOT NULL`,
                { replacements: { corporateId }, type: Sequelize.QueryTypes.UPDATE, transaction }
            );

            // Peko+ bundle: when the expiring GROUP subscription is Peko+, also EXPIRE the
            // bundled WhatsApp BASIC row that was granted on Peko+ purchase. Identified by
            // the trio (subscriptionPaymentRefId IS NULL, billingPlan='BASIC', isCustom=0).
            const [expiringPkg] = await sequelizeConfig.query(
                `SELECT p.id,
                        (SELECT top.id
                           FROM packages top
                          WHERE top.status = 1
                            AND top.packageType = 'GROUP'
                            AND top.partnerId <=> p.partnerId
                          ORDER BY top.priorityLevel DESC
                          LIMIT 1) AS topTierPackageId
                 FROM subscriptions s
                 JOIN packages p ON s.packageId = p.id
                 WHERE s.id = :subscriptionId
                   AND p.packageType = 'GROUP'
                 LIMIT 1`,
                { replacements: { subscriptionId }, type: Sequelize.QueryTypes.SELECT, transaction }
            );
            if (expiringPkg?.topTierPackageId && expiringPkg.topTierPackageId === expiringPkg.id) {
                await sequelizeConfig.query(
                    `UPDATE whatsAppSubscriptions
                     SET status = CASE WHEN isCancelled = 1 THEN 'CANCELLED' ELSE 'EXPIRED' END
                     WHERE corporateUserId = :corporateId
                       AND status = 'ACTIVE'
                       AND subscriptionPaymentRefId IS NULL
                       AND billingPlan = 'BASIC'
                       AND isCustom = 0`,
                    { replacements: { corporateId }, type: Sequelize.QueryTypes.UPDATE, transaction }
                );
            }
        }

        if (packageType === 'INDIVIDUAL') {
            // Retire this individual base's OWN addons (scoped by its packageId — never other plans').
            // All individual addons are time-bound (monthly/annual), so every one retires with the base.
            // Per-row status: isCancelled=1 → CANCELLED, else EXPIRED.
            await sequelizeConfig.query(
                `UPDATE subscriptions
                 SET status = CASE WHEN isCancelled = 1 THEN 'CANCELLED' ELSE 'EXPIRED' END
                 WHERE corporateUserId = :corporateId
                   AND packageId = :packageId
                   AND isCustom = 1
                   AND status = 'ACTIVE'`,
                { replacements: { corporateId, packageId: subscription.packageId }, type: Sequelize.QueryTypes.UPDATE, transaction }
            );
        }
        // Commit the transaction if all queries succeed
        await transaction.commit();
    } catch (error) {
        // Rollback the transaction in case of any failure
        try {
            await transaction.rollback();
        } catch (error) {
            customLog(traceId, "error", { message:"Error in rollback transaction handleCancelledSubscription", error })
        }
        return false
    }
};

const updateSubscriptionToBasic = async (corporateId, partnerId, traceId = null) => {
    if (!corporateId) {
        customLog(traceId, "error", { message: "updateSubscriptionToBasic called with null/undefined corporateId — skipping" });
        return;
    }

    await sequelizeConfig.query(
        `UPDATE subscriptions SET status = "ACTIVE"
         WHERE corporateUserId = :corporateId AND subscriptionPaymentRefId IS NULL`,
        { replacements: { corporateId }, type: Sequelize.QueryTypes.UPDATE }
    );

    // Keep corporateUsers.packageId in sync with the basic plan, matching the
    // same logic used by handleCancelledSubscription and expireGraceSubscription.
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
            `UPDATE corporateUsers SET packageId = :packageId WHERE id = :corporateId`,
            { replacements: { packageId: packageBasic.id, corporateId }, type: Sequelize.QueryTypes.UPDATE }
        );
    } else {
        customLog(traceId, "error", { message: "updateSubscriptionToBasic: no basic GROUP package found — skipping packageId update", corporateId, partnerId });
    }

    // Expire time-bound addons (payroll etc.) — no renewal mechanism exists for addons without
    // an active main plan. Permanent one-time addons (eSign, Garage — subscriptionEndDate=null)
    // are intentionally left ACTIVE since they were purchased independently.
    await sequelizeConfig.query(
        `UPDATE subscriptions SET status = 'EXPIRED'
         WHERE corporateUserId = :corporateId
           AND isCustom = 1
           AND status = 'ACTIVE'
           AND subscriptionEndDate IS NOT NULL`,
        { replacements: { corporateId }, type: Sequelize.QueryTypes.UPDATE }
    );
}
