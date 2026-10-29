const Sequelize = require("sequelize");
const sequelizeConfig = require("../configs/database/index");
const { createNotification } = require("../models/use-cases/notification");
const { customLog } = require("../utils/loggerHelper");
// Env values are strings; dueDaysRemaining is a number, so compare as numbers (a "7" never === 7).
// parseInt leaves an unset/empty value as NaN, which never matches, so no reminder is sent then.
const preReminderDays = parseInt(process.env.SUBSCRIPTION_PRE_REMINDER, 10);

exports.checkSubscriptionValidity = async () => {
  try {
    const query = `
      SELECT
          subscriptions.*,
          credentials.username
      FROM
          subscriptions
      JOIN
          corporateUsers ON subscriptions.corporateUserId = corporateUsers.id
      JOIN
          credentials ON corporateUsers.credentialId = credentials.id
      WHERE
          subscriptions.status != 'EXPIRED'
    `;

    const res = await sequelizeConfig.query(query, {
      type: Sequelize.QueryTypes.SELECT,
    });
    const newCurrentDate = new Date();
    newCurrentDate.setHours(0, 0, 0, 0);

    res.forEach(async (element) => {
      // forEach does not await async callbacks, so catch per item or the error is lost
      try {
        const newEndDate = new Date(element.subscriptionEndDate);
        newEndDate.setHours(0, 0, 0, 0);
        const dueDaysRemaining = calculatePreExpiry(newEndDate, newCurrentDate);
        if (dueDaysRemaining === preReminderDays && element.status !== "DUE") {
          await createNotification({
            notificationTitle: "Subscription Reminder",
            notificationBrief: `Your subscription expires in ${preReminderDays} days. Please renew it soon to continue accessing premium services without interruption.`,
            notificationTo: [element.username],
            notificationCategory: "CORPORATE",
            notificationBy: "ADMIN",
          });
        }
      } catch (error) {
        customLog(null, "error", { message: "checkSubscriptionValidity failed for subscription", subscriptionId: element?.id, error: error?.message || error });
      }
    });
  } catch (error) {
    customLog(null, "error", { message:"Error in checkSubscriptionValidity", error })
    throw error;
  }
};

const calculatePreExpiry = (endDate, currentDate) => {
  const timeDiff = endDate - currentDate;
  return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
};
