const Sequelize = require("sequelize");
const sequelizeConfig = require("../configs/database/index");
const operatorsData = require("../utils/operatorsData.json");
const accessKey = operatorsData["niPaymentGateway"]["accessKey"];
const moment = require("moment");
const { createNotification } = require("../models/use-cases/notification");
const {
  findServiceOperatorByAccessKey,
  checkSaveCardExists,
  getAccessTokenForAutoPay,
  createAutoPay,
} = require("../utils/autoRenewalMethods");
const { findCorporateUserData } = require("../models/use-cases/corporateUser");
const {
  createSubscription:createOfficeAddressSubscription,
} = require("../models/use-cases/officeAddressSubscriptions");
const {
  createSubscription:createPekoWorksSubscription,
} = require("../models/use-cases/pekoWorksSubscription");
const { customLog } = require("../utils/loggerHelper");

exports.officeAddressSubscriptionAutoRenewal = async () => {
  try {

    const yesterday = moment().subtract(1, "days").format("YYYY-MM-DD");

    const query = `
               SELECT
                   officeAddressSubscriptions.*,
                    credentials.username,
                    orders.corporateTxnId,
                    orders.workspaceOrderStatus,
                    orders.orderResponse
               FROM
                   officeAddressSubscriptions
               JOIN
                   credentials ON officeAddressSubscriptions.credentialId = credentials.id
                JOIN
                   orders ON officeAddressSubscriptions.orderId = orders.id
               WHERE
                   officeAddressSubscriptions.status = 'ACTIVE' AND
                   officeAddressSubscriptions.paymentRefId IS NOT NULL
                   AND DATE(officeAddressSubscriptions.endDate) = :yesterday
               `;

    const activeSubscriptions = await sequelizeConfig.query(query, {
      replacements: { yesterday },
      type: Sequelize.QueryTypes.SELECT,
    });

    if (activeSubscriptions.length == 0) return;

    const serviceDetails = await findServiceOperatorByAccessKey(accessKey);
    if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
      return;
    }
    let vendorUrl = serviceDetails.apiUrl;
    const outletReference = serviceDetails.optional1;

    activeSubscriptions.forEach(async (subscription) => {
      // forEach does not await async callbacks, so catch per item or the error is lost
      try {
      const { id, credentialId } = subscription;

      // update the subscription status into expired
      await updateOfficeAddressSubscriptionStatus(id, "EXPIRED");

      const corporateUser = await findCorporateUserData(credentialId);

      if (!corporateUser) {
        return;
      }
      const { email, name, city } = corporateUser;

      // check  corporate user have a saved card
      const isCardExist = await checkSaveCardExists(corporateUser.id);
      if (!isCardExist) {
        return;
      }

      let accessToken = await getAccessTokenForAutoPay(vendorUrl, accessKey);

      // payment for next subscription period
      const response = await createAutoPay(
        { vendorUrl, accessToken, outletReference },
        { subscriptionPrice: subscription.price, name, email, city },
        isCardExist
      );

      if (response && response?.state == "PURCHASED") {
        const corporateTxnId = new Date().valueOf();

        // create a new subscription entry
        const startDate = moment().startOf("day").toDate();
        let endDate;
        if (subscription.billingType == "MONTHLY") {
          endDate = moment().add(29, "days").endOf("day").toDate();
        } else {
          endDate = moment().add(364, "days").endOf("day").toDate();
        }
        const subscriptionData = {
          startDate,
          endDate,
          paymentRefId: corporateTxnId,
          price: subscription.price,
          billingType: subscription.billingType,
          orderId: subscription.orderId,
          credentialId: subscription.credentialId,
        };
        await createOfficeAddressSubscription(subscriptionData);

        const { username } = subscription;

        const notificationData = {
          notificationTitle: "Office Address Renewal Successful",
          notificationBrief: `We are pleased to inform you that your Office address auto-renewal has been successful`,
          notificationTo: [username],
          notificationCategory: "CORPORATE",
          notificationBy: "ADMIN",
        };
        createNotification(notificationData);

        // const to = email;
        // const subject = "Office address autorenewal successful";
        // const body = emailTemplates.generateSubscriptionSuccessEmail(
        //   name,
        //   corporateTxnId,
        //   subscription
        // );
        // await emailer.email(to, subject, body);
      } else {

        const { username } = subscription;
        const notificationData = {
          notificationTitle: "Office Address Auto Renewal Failed",
          notificationBrief: `We regret to inform you that your subscription auto-renewal has not been successful.`,
          notificationTo: [username],
          notificationCategory: "CORPORATE",
          notificationBy: "ADMIN",
        };
        createNotification(notificationData);
      }
      } catch (error) {
          customLog(null, "error", { message: "Office address auto-debit failed for subscription", subscriptionId: subscription?.id, error: error?.message || error });
      }
    });
  } catch (error) {
    customLog(null, "error", { error })

  }
};

const updateOfficeAddressSubscriptionStatus = async (id, status) => {
  const updateQuery = `
      UPDATE officeAddressSubscriptions
      SET status = :status
      WHERE id = :id
      `;
  await sequelizeConfig.query(updateQuery, {
    replacements: { id, status },
    type: Sequelize.QueryTypes.UPDATE,
  });
};

exports.pekoWorksSubscriptionAutoRenewal = async () => {
  try {

    const yesterday = moment().subtract(1, "days").format("YYYY-MM-DD");

    const query = `
               SELECT
                   pekoWorksSubscriptions.*,
                    credentials.username,
                    orders.corporateTxnId,
                    orders.workspaceOrderStatus,
                    orders.orderResponse
               FROM
                   pekoWorksSubscriptions
               JOIN
                   credentials ON pekoWorksSubscriptions.credentialId = credentials.id
                JOIN
                   orders ON pekoWorksSubscriptions.orderId = orders.id
               WHERE
                   pekoWorksSubscriptions.status = 'ACTIVE' AND
                   pekoWorksSubscriptions.paymentRefId IS NOT NULL
                   AND DATE(pekoWorksSubscriptions.endDate) = :yesterday
               `;

    const activeSubscriptions = await sequelizeConfig.query(query, {
      replacements: { yesterday },
      type: Sequelize.QueryTypes.SELECT,
    });

    if (activeSubscriptions.length == 0) return;

    const serviceDetails = await findServiceOperatorByAccessKey(accessKey);
    if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
      return;
    }
    let vendorUrl = serviceDetails.apiUrl;
    const outletReference = serviceDetails.optional1;

    activeSubscriptions.forEach(async (subscription) => {
      // forEach does not await async callbacks, so catch per item or the error is lost
      try {
      const { id, credentialId } = subscription;

      // update the subscription status into expired
      await updatePekoWorksSubscriptionStatus(id, "EXPIRED");

      const corporateUser = await findCorporateUserData(credentialId);

      if (!corporateUser) {
        return;
      }
      const { email, name, city } = corporateUser;

      // check  corporate user have a saved card
      const isCardExist = await checkSaveCardExists(corporateUser.id);
      if (!isCardExist) {
        return;
      }

      let accessToken = await getAccessTokenForAutoPay(vendorUrl, accessKey);

      // payment for next subscription period
      const response = await createAutoPay(
        { vendorUrl, accessToken, outletReference },
        { subscriptionPrice: subscription.price, name, email, city },
        isCardExist
      );

      if (response && response?.state == "PURCHASED") {
        const corporateTxnId = new Date().valueOf();

        // create a new subscription entry
        const startDate = moment().startOf("day").toDate();
        let endDate;
        if (subscription.billingType == "MONTHLY") {
          endDate = moment().add(29, "days").endOf("day").toDate();
        } else {
          endDate = moment().add(364, "days").endOf("day").toDate();
        }
        const subscriptionData = {
          startDate,
          endDate,
          paymentRefId: corporateTxnId,
          price: subscription.price,
          billingType: subscription.billingType,
          orderId: subscription.orderId,
          credentialId: subscription.credentialId,
        };
        await createPekoWorksSubscription(subscriptionData);

        const { username } = subscription;

        const notificationData = {
          notificationTitle: "Peko Works Renewal Successful",
          notificationBrief: `We are pleased to inform you that your Peko works auto-renewal has been successful`,
          notificationTo: [username],
          notificationCategory: "CORPORATE",
          notificationBy: "ADMIN",
        };
        createNotification(notificationData);

        // const to = email;
        // const subject = "Peko works autorenewal successful";
        // const body = emailTemplates.generateSubscriptionSuccessEmail(
        //   name,
        //   corporateTxnId,
        //   subscription
        // );
        // await emailer.email(to, subject, body);
      } else {

        const { username } = subscription;
        const notificationData = {
          notificationTitle: "Peko Works Auto Renewal Failed",
          notificationBrief: `We regret to inform you that your subscription auto-renewal has not been successful.`,
          notificationTo: [username],
          notificationCategory: "CORPORATE",
          notificationBy: "ADMIN",
        };
        createNotification(notificationData);
      }
      } catch (error) {
          customLog(null, "error", { message: "Peko Works auto-debit failed for subscription", subscriptionId: subscription?.id, error: error?.message || error });
      }
    });
  } catch (error) {
    customLog(null, "error", { error })

  }
};

const updatePekoWorksSubscriptionStatus = async (id, status) => {
  const updateQuery = `
      UPDATE pekoWorksSubscriptions
      SET status = :status
      WHERE id = :id
      `;
  await sequelizeConfig.query(updateQuery, {
    replacements: { id, status },
    type: Sequelize.QueryTypes.UPDATE,
  });
};
