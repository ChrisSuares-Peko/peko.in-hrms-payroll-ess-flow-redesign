const Sequelize = require("sequelize");
const sequelizeConfig = require("../configs/database/index");
const axios = require("axios");
const moment = require("moment");
const { createNotification } = require("../models/use-cases/notification");
const emailer = require("../utils/emailer");
const emailTemplates = require("../utils/emailTemplates");
const { fetchPartnerDetails } = require("../models/use-cases/systemUser");
const { partnerLogos } = require("../utils/partnerLogos");
const { customLog } = require("../utils/loggerHelper");
const {
  findServiceOperatorByAccessKey,
  // checkSaveCardExists,
  // getAccessTokenForAutoPay,
  // createAutoPay,
} = require("../utils/autoRenewalMethods");
const { createOrderForSubscription } = require("../utils/subscription/createOrderForSubscription");
const CorporateSoftwareSubscription = require("../models/entities/corporateSoftwareSubscription");
const { commonFailedTemplate } = require("../utils/email/emailTemplates/common");
const { getValue, setValue } = require("../utils/cacheDataMethods");

const PG_ACCESS_KEY = "cashfree_pg";
const SOFTWARE_ACCESS_KEY = "software_service";

exports.corporateSoftwareSubscriptionAutoRenewal = async () => {
  try {
    const targetDate = moment().add(2, "days").format("YYYY-MM-DD");

    const query = `
      SELECT
        css.id,
        css.corporateUserId,
        css.orderId,
        css.planSkuId,
        css.productName,
        css.webUrl,
        css.planName,
        css.purchaseType,
        css.billingCycle,
        css.subscriptionEndDate,
        corporateUsers.name,
        corporateUsers.email,
        corporateUsers.mobileNo,
        corporateUsers.city,
        corporateUsers.contactPersonName,
        corporateUsers.country,
        credentials.username,
        credentials.registeredBy,
        credentials.id AS credentialId,
        orders.id AS currentOrderId,
        orders.corporateTxnId AS originalCorporateTxnId,
        orders.amountInINR,
        orders.serviceOperatorId
      FROM corporate_software_subscriptions css
      JOIN corporateUsers ON css.corporateUserId = corporateUsers.id
      JOIN credentials ON corporateUsers.credentialId = credentials.id
      JOIN orders ON css.orderId = orders.id
      WHERE
        css.status = 'ACTIVE'
        AND css.isCancelled = false
        AND css.purchaseType = 'subscription'
        AND DATE(css.subscriptionEndDate) = :targetDate
    `;

    const subscriptions = await sequelizeConfig.query(query, {
      replacements: { targetDate },
      type: Sequelize.QueryTypes.SELECT,
    });

    if (subscriptions.length === 0) {
      customLog(null, "info", {
        message: "Corporate Software Subscription AutoRenewal: no subscriptions due for renewal",
        targetDate,
      });
      return;
    }

    customLog(null, "info", {
      message: `Corporate Software Subscription AutoRenewal: found ${subscriptions.length} subscription(s) due for renewal`,
      targetDate,
    });

    // Fetch PG service operator once for all subscriptions
    const pgServiceDetails = await findServiceOperatorByAccessKey(PG_ACCESS_KEY);
    if (Object.prototype.hasOwnProperty.call(pgServiceDetails, "error")) {
      customLog(null, "error", {
        message: "Corporate Software Subscription AutoRenewal: PG service operator not found",
      });
      return;
    }
    const pgVendorUrl = pgServiceDetails.apiUrl;
    const pgOutletReference = pgServiceDetails.optional1;

    // Fetch software service operator once for the Zoftware API key
    const softwareServiceDetails = await findServiceOperatorByAccessKey(SOFTWARE_ACCESS_KEY);
    if (Object.prototype.hasOwnProperty.call(softwareServiceDetails, "error")) {
      customLog(null, "error", {
        message: "Corporate Software Subscription AutoRenewal: software service operator not found",
      });
      return;
    }
    const zoftwareApiUrl = softwareServiceDetails?.apiUrl;
    const zoftwareApiKey = softwareServiceDetails?.optional1;

    if (!zoftwareApiUrl || !zoftwareApiKey) {
      customLog(null, "error", {
        message: "Corporate Software Subscription AutoRenewal: Zoftware API URL or key missing",
      });
      return;
    }

    for (const subscription of subscriptions) {
      await processRenewal(subscription, {
        pgVendorUrl,
        pgOutletReference,
        zoftwareApiUrl,
        zoftwareApiKey,
      });
    }
  } catch (error) {
    customLog(null, "error", {
      message: "Corporate Software Subscription AutoRenewal: top-level error",
      error,
    });
  }
};

async function processRenewal(subscription, vendorData) {
  const {
    id,
    corporateUserId,
    planSkuId,
    productName,
    webUrl,
    planName,
    purchaseType,
    billingCycle,
    name,
    email,
    mobileNo,
    // city,
    contactPersonName,
    country,
    username,
    registeredBy,
    credentialId,
    originalCorporateTxnId,
    amountInINR,
    serviceOperatorId,
  } = subscription;

  const {
    //  pgVendorUrl,
    // pgOutletReference,
    zoftwareApiUrl,
    zoftwareApiKey,
  } = vendorData;

  customLog(null, "info", {
    message: `Corporate Software Subscription AutoRenewal: processing subscription id=${id}`,
    planSkuId,
    email,
  });

  try {

    const partnerData = registeredBy
      ? await fetchPartnerDetails(registeredBy)
      : await partnerLogos();

    // // 1. Check if user has a saved card
    // const savedCard = await checkSaveCardExists(corporateUserId);
    // if (!savedCard) {
    //   customLog(null, "info", {
    //     message: `Corporate Software Subscription AutoRenewal: no saved card for corporateUserId=${corporateUserId}, skipping`,
    //   });
    //   await sendRenewalFailureNotification({ username, credentialId, productName, reason: "no_card", email, name: contactPersonName || name, partnerData });
    //   return;
    // }
    const contactName = contactPersonName || name;

    // 2. Get Zoftware session ID for the current user
    const sessionId = await getSessionIdForScheduler({
      API_URL: zoftwareApiUrl,
      api_key: zoftwareApiKey,
      email,
      phone: mobileNo,
      name: contactName,
      corporateUserId,
    });

    if (!sessionId) {
      customLog(null, "error", {
        message: `Corporate Software Subscription AutoRenewal: could not get Zoftware session for subscription id=${id}`,
      });
      await handleVendorFailure("Could not create Zoftware session");
      return;
    }

     const pgAmount = parseFloat(amountInINR);

    const pgResponse = {state:"PURCHASED"}
    // Here, the pgResponse is hardcoded because the entire module was 
    // copied from the UAE version. The payment gateway is different here, 
    // so the flow needs to be updated later to align with Cashfree.
    if (!pgResponse || pgResponse?.state !== "PURCHASED") {
      customLog(null, "error", {
        message: `Corporate Software Subscription AutoRenewal: PG payment failed for subscription id=${id}`,
        pgResponse,
      });
      await sendRenewalFailureNotification({ username, credentialId, productName, reason: "pg_failed", email, name: contactName, partnerData });
      return;
    }

    customLog(null, "info", {
      message: `Corporate Software Subscription AutoRenewal: PG payment success for subscription id=${id}`,
    });

    const newCorporateTxnId = new Date().valueOf();
    const now = new Date();
    let newSubscriptionId;

    const transaction = await sequelizeConfig.transaction();

    try {
      // 5. Create new order entry
      const orderPayload = {
        subscriptionDetails: {
          planSkuId,
          productName,
          planName,
          billingCycle,
          purchaseType,
          relatedSaleReference: String(originalCorporateTxnId),
        },
      };

      await createOrderForSubscription(
        {
          corporateTxnId: newCorporateTxnId,
          transactionDate: now,
          amountInINR: pgAmount,
          baseAmount: pgAmount,
          baseCurrency: "AED",
          exchangeRate: 1,
          status: "SUCCESS",
          paymentMode: "PAYMENT GATEWAY",
          paymentModeResponse: JSON.stringify(pgResponse),
          accountNo: null,
          surcharge: 0,
          serviceOperatorId: serviceOperatorId || null,
          credentialId,
          subCorporateUserId: null,
          orderResponse: JSON.stringify(orderPayload),
          message: "Payment Successful",
          optional: "SOFTWARE-SUBSCRIPTION",
          createdAt: now,
          updatedAt: now,
        },
        transaction
      );

      // 6. Fetch the newly created order ID within the same transaction
      const [orderRow] = await sequelizeConfig.query(
        `SELECT id FROM orders WHERE corporateTxnId = :corporateTxnId LIMIT 1`,
        {
          replacements: { corporateTxnId: String(newCorporateTxnId) },
          type: Sequelize.QueryTypes.SELECT,
          transaction,
        }
      );

      if (!orderRow?.id) {
        throw new Error(`Order row not found after insert for corporateTxnId=${newCorporateTxnId}`);
      }

      // 7. Create new corporate_software_subscriptions entry (PENDING until Zoftware webhook arrives)
      const newSubscription = await CorporateSoftwareSubscription.create(
        {
          corporateUserId,
          orderId: orderRow.id,
          planSkuId,
          productName,
          webUrl,
          planName,
          billingCycle,
          status: "PENDING",
        },
        { transaction }
      );

      await transaction.commit();

      newSubscriptionId = newSubscription.id;

    } catch (dbError) {
      try {
        await transaction.rollback();
      } catch (rollbackErr) {
        customLog(null, "error", {
          message: "Corporate Software Subscription AutoRenewal: rollback error",
          error: rollbackErr,
        });
      }
      customLog(null, "error", {
        message: `Corporate Software Subscription AutoRenewal: DB error for subscription id=${id}`,
        error: dbError,
      });
      return;
    }

    // Define vendor failure handler here so it is available for both session and sales failures
    const handleVendorFailure = async (errorData) => {
      customLog(null, "error", {
        message: `Corporate Software Subscription AutoRenewal: Zoftware API failed for subscription id=${id}`,
        error: errorData,
      });
      await sequelizeConfig.query(
        `UPDATE orders SET status = 'FAILURE', message = 'Vendor API failed' WHERE corporateTxnId = :corporateTxnId`,
        { replacements: { corporateTxnId: String(newCorporateTxnId) }, type: Sequelize.QueryTypes.UPDATE }
      );
      await sequelizeConfig.query(
        `UPDATE corporate_software_subscriptions SET status = 'FAILED' WHERE id = :id`,
        { replacements: { id: newSubscriptionId }, type: Sequelize.QueryTypes.UPDATE }
      );
      await sendRenewalFailureNotification({ username, credentialId, productName, reason: "vendor_failed", email, name: contactName, partnerData });
    };

    // 8. POST renewal sale to Zoftware
    const salesPayload = {
      skuCode: planSkuId,
      saleType: "renewal_sale",
      relatedSaleReference: String(originalCorporateTxnId),
      quantity: 1,
      partner: {
        name: "Peko",
        saleReference: String(newCorporateTxnId),
      },
      customer: {
        name: contactName,
        email,
        phone: mobileNo,
        additionalInfo: {
          company: name,
          country: country || "UAE",
        },
      },
      payment: {
        provider: "NETWORK_INTERNATIONAL",
        transactionId: String(newCorporateTxnId),
        amount: String(pgAmount),
        currency: "AED",
        status: "captured",
      },
    };

    const zoftwareConfig = {
      method: "POST",
      url: `${zoftwareApiUrl}/sales`,
      headers: {
        Accept: "application/json",
        "X-API-Key": zoftwareApiKey,
        "X-Session-Id": sessionId,
      },
      data: salesPayload,
      timeout: 10000,
    };

    customLog(null, "info", {
      message: `Corporate Software Subscription AutoRenewal: calling Zoftware sales API for subscription id=${id}`,
      request: zoftwareConfig,
    }, "VENDOR");

    let zoftwareResponse;
    try {
      zoftwareResponse = await axios(zoftwareConfig);
      customLog(null, "info", {
        message: `Corporate Software Subscription AutoRenewal: Zoftware sales API response for subscription id=${id}`,
        response: zoftwareResponse.data,
      }, "VENDOR");
    } catch (zoftwareError) {
      await handleVendorFailure(zoftwareError?.response?.data || zoftwareError?.message);
      return;
    }

    if (!zoftwareResponse?.data?.success) {
      await handleVendorFailure(zoftwareResponse?.data);
      return;
    }

    // 9. Send success notification and email
    const notificationData = {
      notificationTitle: "Software Subscription Renewal Successful",
      notificationBrief: `Your ${productName} (${planName}) subscription has been successfully renewed.`,
      notificationTo: [username],
      notificationCategory: "CORPORATE",
      notificationBy: "ADMIN",
      accessKey: null,
      action: "2",
    };
    createNotification(notificationData, credentialId);

    const subject = `Renewal Successful: Your ${productName} subscription is active`;
    const subscriptionForEmail = {
      packageName: `${productName} - ${planName} Software`,
      billingType: billingCycle?.toUpperCase(),
      email,
      subscriptionPrice: pgAmount,
    };
    const body = emailTemplates.generateSubscriptionSuccessEmail(
      contactName,
      newCorporateTxnId,
      subscriptionForEmail,
      partnerData
    );

    emailer.email(email, subject, body);

    customLog(null, "info", {
      message: `Corporate Software Subscription AutoRenewal: renewal complete for subscription id=${id}`,
      newCorporateTxnId,
    });
  } catch (error) {
    customLog(null, "error", {
      message: `Corporate Software Subscription AutoRenewal: unexpected error for subscription id=${id}`,
      error,
    });
  }
}

async function getSessionIdForScheduler({ API_URL, api_key, email, phone, name, corporateUserId }) {
  const redisKey = `${SOFTWARE_ACCESS_KEY}-sessionId-${corporateUserId}`;
  const cached = await getValue(redisKey);
  if (cached) return cached;
  try {
    const response = await axios({
      method: "POST",
      url: `${API_URL}/sessions`,
      headers: { "Content-Type": "application/json", "X-API-Key": api_key },
      data: { email, phone, name, deviceType: "api", platform: "unknown" },
    });
    const sessionId = response?.data?.data?.sessionId;
    const expiresAt = response?.data?.data?.expiresAt;
    if (!sessionId || !expiresAt) return null;
    const ttlInSeconds = Math.max(Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000), 1);
    await setValue(redisKey, ttlInSeconds, sessionId);
    return sessionId;
  } catch (error) {
    customLog(null, "error", {
      message: "getSessionIdForScheduler: session creation failed",
      data: error?.response?.data || error?.message,
    });
    return null;
  }
}

async function sendRenewalFailureNotification({ username, credentialId, productName, reason, email, name, partnerData }) {
  let brief;
  if (reason === "no_card") {
    brief = `We could not auto-renew your ${productName} subscription because no saved payment method was found. Please update your payment details to avoid service interruption.`;
  } else {
    brief = `We regret to inform you that the auto-renewal of your ${productName} subscription has failed. Please contact support if this issue persists.`;
  }

  const notificationData = {
    notificationTitle: "Software Subscription Auto Renewal Failed",
    notificationBrief: brief,
    notificationTo: [username],
    notificationCategory: "CORPORATE",
    notificationBy: "ADMIN",
    accessKey: null,
    action: "2",
  };
  createNotification(notificationData, credentialId);


  const subject = "Software Subscription Renewal Failed";
  const serviceUrl = partnerData.baseUrl;
  const body = commonFailedTemplate(name, "Software Subscription", serviceUrl, partnerData);

  emailer.email(email, subject, body);
}
