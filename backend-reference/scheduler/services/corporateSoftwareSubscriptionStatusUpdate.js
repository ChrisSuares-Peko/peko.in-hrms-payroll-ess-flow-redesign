const Sequelize = require("sequelize");
const sequelizeConfig = require("../configs/database/index");
const moment = require("moment");
const { customLog } = require("../utils/loggerHelper");

exports.deactivateExpiredSubscriptions = async () => {
  try {
    const yesterday = moment().subtract(1, "days").format("YYYY-MM-DD");

    // Mark cancelled subscriptions whose end date has passed
    const [, cancelledRows] = await sequelizeConfig.query(
      `UPDATE corporate_software_subscriptions
       SET status = 'CANCELLED'
       WHERE status = 'ACTIVE'
         AND isCancelled = true
         AND DATE(subscriptionEndDate) <= :yesterday`,
      {
        replacements: { yesterday },
        type: Sequelize.QueryTypes.UPDATE,
      }
    );

    // Mark expired subscriptions whose end date has passed
    const [, expiredRows] = await sequelizeConfig.query(
      `UPDATE corporate_software_subscriptions
       SET status = 'EXPIRED'
       WHERE status = 'ACTIVE'
         AND isCancelled = false
         AND DATE(subscriptionEndDate) <= :yesterday`,
      {
        replacements: { yesterday },
        type: Sequelize.QueryTypes.UPDATE,
      }
    );

    customLog(null, "info", {
      message: "deactivateExpiredSubscriptions: processed subscriptions past their end date",
      cancelled: cancelledRows ?? 0,
      expired: expiredRows ?? 0,
      yesterday,
    });
  } catch (error) {
    customLog(null, "error", {
      message: "deactivateExpiredSubscriptions: error deactivating subscriptions",
      error,
    });
  }
};

exports.activateDueSubscriptions = async () => {
  try {
    const today = moment().format("YYYY-MM-DD");

    const [, activatedRows] = await sequelizeConfig.query(
      `UPDATE corporate_software_subscriptions
       SET status = 'ACTIVE'
       WHERE isCancelled = false
         AND DATE(subscriptionStartDate) = :today`,
      {
        replacements: { today },
        type: Sequelize.QueryTypes.UPDATE,
      }
    );

    customLog(null, "info", {
      message: "activateDueSubscriptions: activated subscriptions whose start date is today",
      activated: activatedRows ?? 0,
      today,
    });
  } catch (error) {
    customLog(null, "error", {
      message: "activateDueSubscriptions: error activating subscriptions",
      error,
    });
  }
};