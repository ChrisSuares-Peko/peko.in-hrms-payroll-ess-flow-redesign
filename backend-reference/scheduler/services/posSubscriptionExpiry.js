const Sequelize = require("sequelize");

const sequelizeConfig = require("../configs/database/index");
const { createNotification } = require("../models/use-cases/notification");
const { customLog } = require("../utils/loggerHelper");
const operatorsData = require("../utils/operatorsData.json");
const { getConfig, setRestaurantStatus } = require("../utils/restonikGateway");

// Peko POS is bought once and lapses — there is no mandate, so none of the
// Cashfree renewal/grace sweeps (which all key on vendorSubscriptionId) ever
// touch these rows. Without this job an expired POS grant would stay ACTIVE
// forever and keep serving the dashboard.
//
// Suspending the restaurant at the vendor is best-effort: the Peko row is
// expired either way, and a vendor outage must not block that.

const POS_ACCESS_CODE = operatorsData.pekoPos.accessKey;

// Stay well inside Restonik's 120 requests/minute ceiling.
const VENDOR_CALL_DELAY_MS = 500;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

exports.expirePosSubscriptions = async (traceId = null) => {
    try {
        const rows = await sequelizeConfig.query(
            `SELECT
                ss.id,
                ss.vendorResponse,
                ss.isCancelled,
                p.packageName,
                c.username
             FROM serviceSubscriptions ss
             JOIN packages p ON p.id = ss.packageId AND p.accessCode = :accessCode
             LEFT JOIN credentials c ON c.id = ss.credentialId
             WHERE ss.status = 'ACTIVE'
               AND ss.vendorSubscriptionId IS NULL
               AND ss.subscriptionEndDate IS NOT NULL
               AND ss.subscriptionEndDate < NOW()`,
            {
                replacements: { accessCode: POS_ACCESS_CODE },
                type: Sequelize.QueryTypes.SELECT,
            }
        );

        if (!rows.length) return;

        customLog(traceId, "info", {
            message: "posSubscriptionExpiry: expiring lapsed Peko POS subscriptions",
            count: rows.length,
        });

        const cfg = await getConfig();

        for (const row of rows) {
            await sequelizeConfig.query(
                `UPDATE serviceSubscriptions
                 SET status = CASE WHEN isCancelled = 1 THEN 'CANCELLED' ELSE 'EXPIRED' END
                 WHERE id = :id
                   AND status = 'ACTIVE'`,
                { replacements: { id: row.id }, type: Sequelize.QueryTypes.UPDATE }
            );

            let vendorResponse = row.vendorResponse;
            if (typeof vendorResponse === "string") {
                try {
                    vendorResponse = JSON.parse(vendorResponse);
                } catch (parseErr) {
                    vendorResponse = null;
                }
            }
            const restaurantId = vendorResponse && vendorResponse.restaurantId;

            if (!cfg.error && restaurantId) {
                try {
                    await setRestaurantStatus(cfg, restaurantId, "suspended", traceId);
                } catch (vendorErr) {
                    customLog(
                        traceId,
                        "error",
                        {
                            message: "posSubscriptionExpiry: could not suspend restaurant",
                            subscriptionId: row.id,
                            restaurantId,
                            error: vendorErr?.response?.data || vendorErr?.message,
                        },
                        "VENDOR"
                    );
                }
                await sleep(VENDOR_CALL_DELAY_MS);
            }

            if (row.username) {
                await createNotification({
                    notificationTitle: "Peko POS subscription expired",
                    notificationBrief: `Your Peko POS ${row.packageName || ""} subscription has ended. Renew it to continue using your POS.`,
                    notificationTo: [row.username],
                    notificationCategory: "CORPORATE",
                    notificationBy: "ADMIN",
                });
            }
        }
    } catch (error) {
        customLog(traceId, "error", {
            message: "posSubscriptionExpiry failed",
            error: error?.message,
        });
    }
};
