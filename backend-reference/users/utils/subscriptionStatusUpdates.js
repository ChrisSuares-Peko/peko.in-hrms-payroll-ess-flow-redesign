const Sequelize = require("sequelize");
const sequelizeConfig = require("../configs/database/index");
const { customLog } = require("../utils/loggerHelper");

exports.subscriptionStatusUpdateForCorporate = async (corporateUserId) => {
    try {
        
        // Skip rows with isGracePeriod = true — the scheduler's retry job owns those and
        // will expire them via expireGraceSubscription() after maxRetries are exhausted.
        // Expiring them here would short-circuit the grace-period retries.
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
                   subscriptions.corporateUserId = :corporateUserId AND
                   subscriptions.subscriptionPaymentRefId IS NOT NULL
                   AND subscriptions.isGracePeriod = false
                   AND DATE(subscriptions.subscriptionEndDate) < CURDATE()
               `;
{/* < CURDATE for cancelling all previously ended subscription */}
        const activeSubscriptions = await sequelizeConfig.query(query, {
            replacements: { corporateUserId },
            type: Sequelize.QueryTypes.SELECT,
        });
       
        if (activeSubscriptions.length == 0) return

        for (const subscription of activeSubscriptions) {

            const { id, corporateUserId, isCustom, isCancelled, packageType } = subscription

            // check weather add ons package is cancelled or not. if it is cancelled update status
            if (isCustom && isCancelled) {
                await updateSubscriptionStatus(id, 'CANCELLED')
                continue
            }
            // check weather main package is cancelled or not. if it is cancelled update status and make basic as default package
            if (isCancelled) {
                await handleCancelledSubscription(subscription)
                continue
            }
            // update the subscription status into expired
            await updateSubscriptionStatus(id, 'EXPIRED')

            if (packageType === 'GROUP') {
                await updateSubscriptionToBasic(corporateUserId)
            }

        }


    } catch (error) {
        customLog(null, "error", { message:"Error in subscription status update", error })
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
const handleCancelledSubscription = async (subscription) => {
    const { id: subscriptionId, packageType, corporateUserId: corporateId, partnerId } = subscription;
    const status = 'CANCELLED';

    // Start a transaction
    const transaction = await sequelizeConfig.transaction();
    try {
        // Update subscription status to CANCELLED
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
            // Update subscription status to ACTIVE for basic subscriptions
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

            // Update corporate user's packageId
            const updateCorporateUserQuery = `
                UPDATE corporateUsers
                SET packageId = :packageId
                WHERE id = :corporateId
            `;
            await sequelizeConfig.query(updateCorporateUserQuery, {
                replacements: { packageId: packageBasic ? packageBasic.id : null, corporateId },
                type: Sequelize.QueryTypes.UPDATE,
                transaction,
            });
        }
        // Commit the transaction if all queries succeed
        await transaction.commit();
    } catch (error) {
        // Rollback the transaction in case of any failure
        await transaction.rollback();
        return false
    }
};

const updateSubscriptionToBasic = async (corporateId) => {
    const checkActivePaidQuery = `
        SELECT s.id FROM subscriptions s
        INNER JOIN packages p ON p.id = s.packageId
        WHERE s.corporateUserId = :corporateId
          AND s.status = 'ACTIVE'
          AND s.subscriptionPaymentRefId IS NOT NULL
          AND s.isCustom = false
          AND p.packageType = 'GROUP'
        LIMIT 1
    `;
    const activePaid = await sequelizeConfig.query(checkActivePaidQuery, {
        replacements: { corporateId },
        type: Sequelize.QueryTypes.SELECT,
    });
    if (activePaid.length > 0) return;

    const query = `
            UPDATE subscriptions
            SET status = "ACTIVE"
            WHERE corporateUserId = :corporateId
            AND subscriptionPaymentRefId IS NULL
        `;

    await sequelizeConfig.query(query, {
        replacements: { corporateId },
        type: Sequelize.QueryTypes.UPDATE
    });
}
