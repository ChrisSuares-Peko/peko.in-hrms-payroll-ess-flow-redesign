const Subscription = require("../entities/subscription");
const asyncHandler = require("../../middlewares/async");
const { customLog } = require("../../utils/loggerHelper");
const moment = require('moment');
const sequelizeConfig = require('../../configs/database/index');
const { Sequelize } = require("sequelize");

exports.findAllActiveSubscriptions = asyncHandler(async (params) => {
    const { corporateUserId } = params
    try {
        const allActiveSubscriptions = await Subscription.findAll({
            where: {
                corporateUserId: corporateUserId,
                status: 'ACTIVE'
            },
            raw: true,
            nest: true
        })
        return allActiveSubscriptions

    } catch (error) {
        customLog(null, "error", { message: "Error finding active subscriptions", error: error?.message ?? error });
        return []
    }
})

exports.fetchSubscriptionForAutoRenewal = async () => {
    try {
        const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD')

        const query = `
               SELECT
                   subscriptions.*,
                    corporateUsers.name,
                    corporateUsers.contactPersonName,
                    corporateUsers.email,
                    corporateUsers.city,
                    corporateUsers.credentialId,
                    credentials.username,
                    credentials.registeredBy,
                    credentials.id AS credentialId,
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
                   subscriptions.subscriptionPaymentRefId IS NOT NULL
                   AND DATE(subscriptions.subscriptionEndDate) = :yesterday
                   AND subscriptions.isGracePeriod = false
               `;

        const activeSubscriptions = await sequelizeConfig.query(query, {
            replacements: { yesterday },
            type: Sequelize.QueryTypes.SELECT,
        });

        if (!activeSubscriptions || !activeSubscriptions.length) return []

        const expiredSubscriptions = activeSubscriptions.reduce((result, item) => {

            // if it is addon return immediately
            if (item.isCustom === 1) return result;

            // case 1 if it peko+ Append the all add-ons to the peko+ package if any
            if (item.packageType == 'GROUP') {

                const addons = activeSubscriptions.filter(
                    addon =>
                        addon.corporateUserId === item.corporateUserId &&
                        addon.isCustom === 1
                );

                result.push({
                    ...item,
                    addonDetails: addons
                });
            } else {
                // case 2 if it individual package find addon of the package and append if any addon is present
                const addon = activeSubscriptions.find(
                    addon =>
                        addon.packageId === item.packageId &&
                        addon.corporateUserId === item.corporateUserId &&
                        addon.isCustom === 1
                );

                result.push({
                    ...item,
                    addonDetails: addon ? [addon] : []
                });
            }
            return result;
        }, []);

        console.dir(expiredSubscriptions, { dept: null });
        return expiredSubscriptions;
    } catch (error) {
        customLog(null, "error", { message: "Failed to fetch expired subscriptions:", error })
        return []
    }
};

exports.fetchSubscriptionForAutoRenewalRetry = async () => {
    try {

        const query = `
               SELECT
                   subscriptions.*,
                    corporateUsers.name,
                    corporateUsers.contactPersonName,
                    corporateUsers.email,
                    corporateUsers.city,
                    corporateUsers.credentialId,
                    credentials.username,
                    credentials.registeredBy,
                    credentials.id AS credentialId,
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
                   subscriptions.isCancelled = 0 AND
                   (subscriptions.subscriptionPaymentRefId IS NOT NULL OR subscriptions.vendorSubscriptionId IS NOT NULL) AND
                   subscriptions.isGracePeriod = true
               `;

        const activeGraceSubscriptions = await sequelizeConfig.query(query, {
            type: Sequelize.QueryTypes.SELECT,
        });
        if (!activeGraceSubscriptions || !activeGraceSubscriptions.length) return []

        const settingsQuery = `
                 SELECT details 
                 FROM settings
                 WHERE
                 settings.name = 'subscriptionAutoRenewalRetry'
           `;

        const [retryData] = await sequelizeConfig.query(settingsQuery, {
            type: Sequelize.QueryTypes.SELECT,
        });

        if (!retryData || !retryData.details.retrySubscription) return []
        const { maxRetries } = retryData.details
        if (typeof maxRetries !== 'number' || maxRetries <= 0) {
            customLog(null, "error", { message: "fetchSubscriptionForAutoRenewalRetry: maxRetries not configured in settings — aborting" });
            return []
        }

        const expiredSubscriptions = activeGraceSubscriptions.reduce((result, item) => {

            // if it is addon return immediately
            if (item.isCustom === 1) return result;

            // case 1 if it peko+ Append the all add-ons to the peko+ package if any
            if (item.packageType == 'GROUP') {

                const addons = activeGraceSubscriptions.filter(
                    addon =>
                        addon.corporateUserId === item.corporateUserId &&
                        addon.isCustom === 1
                );

                result.push({
                    ...item,
                    maxRetries: maxRetries,
                    addonDetails: addons
                });
            } else {
                // case 2 if it individual package find addon of the package and append if any addon is present
                const addon = activeGraceSubscriptions.find(
                    addon =>
                        addon.packageId === item.packageId &&
                        addon.corporateUserId === item.corporateUserId &&
                        addon.isCustom === 1
                );

                result.push({
                    ...item,
                    maxRetries: maxRetries,
                    addonDetails: addon ? [addon] : []
                });
            }
            return result;
        }, []);

        return expiredSubscriptions;
    } catch (error) {
        customLog(null, "error", { message: "Failed to fetch expired subscriptions:", error })
        return []
    }
};

// Returns ACTIVE WhatsApp subscriptions sitting in grace period (charge failed),
// with the sum of their active add-on (Bot Builder / Shopify Integration) amounts
// + corporate/credential/package info.
// `maxRetries` comes from the `subscriptionAutoRenewalRetry` setting (same source as
// fetchSubscriptionForAutoRenewalRetry above).
exports.fetchWhatsAppSubscriptionForAutoRenewalRetry = async () => {
    try {
        // A credential can hold multiple simultaneous add-ons (Bot Builder + Shopify
        // Integration, or any future add-on) — a LEFT JOIN straight to the isCustom rows would
        // produce one result row PER add-on for a credential holding more than one
        // simultaneously, silently duplicating/undercounting the retry charge. Use a
        // correlated subquery to SUM them into a single row per base subscription instead
        // (mirrors whatsAppTriggerSubscriptionCharges.js).
        const query = `
            SELECT
                ws.id,
                ws.vendorSubscriptionId,
                ws.credentialId,
                ws.corporateUserId,
                ws.billingType,
                ws.billingPlan,
                ws.projectId,
                ws.subscriptionAmountPaid,
                ws.subscriptionEndDate,
                ws.packageId,
                COALESCE((
                    SELECT SUM(ba.subscriptionAmountPaid)
                    FROM whatsAppSubscriptions ba
                    WHERE ba.vendorSubscriptionId = ws.vendorSubscriptionId
                      AND ba.status = 'ACTIVE'
                      AND ba.isCustom = 1
                ), 0) AS addOnAmountPaid,
                cu.email,
                cu.name,
                cu.city,
                cr.username,
                cr.registeredBy,
                pkg.packageName
            FROM whatsAppSubscriptions ws
            LEFT JOIN corporateUsers cu ON cu.id = ws.corporateUserId
            LEFT JOIN credentials cr ON cr.id = ws.credentialId
            LEFT JOIN packages pkg ON pkg.id = ws.packageId
            WHERE ws.status = 'ACTIVE'
              AND ws.isCustom = 0
              AND ws.isGracePeriod = true
              AND ws.vendorSubscriptionId IS NOT NULL
        `;
        const graceWaSubs = await sequelizeConfig.query(query, {
            type: Sequelize.QueryTypes.SELECT,
        });
        if (!graceWaSubs.length) return [];

        const [retryData] = await sequelizeConfig.query(
            `SELECT details FROM settings WHERE settings.name = 'subscriptionAutoRenewalRetry'`,
            { type: Sequelize.QueryTypes.SELECT }
        );
        if (!retryData || !retryData.details.retrySubscription) return [];
        const { maxRetries } = retryData.details;
        if (typeof maxRetries !== 'number' || maxRetries <= 0) {
            customLog(null, "error", { message: "fetchWhatsAppSubscriptionForAutoRenewalRetry: maxRetries not configured in settings — aborting" });
            return [];
        }

        return graceWaSubs.map((row) => ({ ...row, maxRetries }));
    } catch (error) {
        customLog(null, "error", { message: "Failed to fetch grace-period WhatsApp subscriptions", error });
        return [];
    }
};

// Peko Commerce subscriptions in grace period, no addon join needed.
exports.fetchEcommerceStoreSubscriptionForAutoRenewalRetry = async () => {
    try {
        const query = `
            SELECT
                ss.id,
                ss.vendorSubscriptionId,
                ss.credentialId,
                ss.corporateUserId,
                ss.billingType,
                ss.projectId,
                ss.subscriptionAmountPaid,
                ss.subscriptionEndDate,
                ss.packageId,
                cu.email,
                cu.name,
                cr.username,
                cr.registeredBy,
                pkg.packageName
            FROM serviceSubscriptions ss
            JOIN packages pkg ON pkg.id = ss.packageId AND pkg.accessCode = 'ecommerce_store'
            LEFT JOIN corporateUsers cu ON cu.id = ss.corporateUserId
            LEFT JOIN credentials cr ON cr.id = ss.credentialId
            WHERE ss.status = 'ACTIVE'
              AND ss.isCancelled = 0
              AND ss.isGracePeriod = true
              AND ss.vendorSubscriptionId IS NOT NULL
        `;
        const graceEcomSubs = await sequelizeConfig.query(query, {
            type: Sequelize.QueryTypes.SELECT,
        });
        if (!graceEcomSubs.length) return [];

        const [retryData] = await sequelizeConfig.query(
            `SELECT details FROM settings WHERE settings.name = 'subscriptionAutoRenewalRetry'`,
            { type: Sequelize.QueryTypes.SELECT }
        );
        if (!retryData || !retryData.details.retrySubscription) return [];
        const { maxRetries } = retryData.details;
        if (typeof maxRetries !== 'number' || maxRetries <= 0) {
            customLog(null, "error", { message: "fetchEcommerceStoreSubscriptionForAutoRenewalRetry: maxRetries not configured in settings — aborting" });
            return [];
        }

        return graceEcomSubs.map((row) => ({ ...row, maxRetries }));
    } catch (error) {
        customLog(null, "error", { message: "Failed to fetch grace-period Peko Commerce subscriptions", error });
        return [];
    }
};
