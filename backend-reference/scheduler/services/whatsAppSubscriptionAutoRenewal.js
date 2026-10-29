/* eslint-disable no-unused-vars */
const Sequelize = require("sequelize");
const sequelizeConfig = require("../configs/database/index");
const axios = require('axios');
const moment = require('moment');
const { createNotification } = require("../models/use-cases/notification");
const emailer = require('../utils/emailer');
const emailTemplates = require('../utils/emailTemplates');
const { fetchPartnerDetails } = require("../models/use-cases/systemUser");
const { getAccessTokenForAutoPay } = require("../utils/autoRenewalMethods");
const { customLog } = require("../utils/loggerHelper");
const operatorsData = require("../utils/operatorsData.json");
const accessKey = operatorsData["niPaymentGateway"]["accessKey"]
const whatsappAccessKey = operatorsData["whatsAppForBusiness"]["accessKey"];
const { fetchServiceDetails } = require("../utils/checkAndFetchServiceDetails");
const { resolveEmailTemplate } = require("./emailTemplateResolver");
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require("../utils/emailTemplateKeys");
const { v2LayoutVariables } = require("../utils/emailTemplate/sharedLayout");

const frontendBaseUrl = process.env.NODE_ENV === "production" ? process.env.PRODUCTION_URL : process.env.FRONTEND_STAGING_URL;

exports.whatsappSubscriptionAutoRenewal = async () => {
    try {
        // Get today's date in 'YYYY-MM-DD' format
        const today = new Date().toISOString().split('T')[0];

        const query = `
            SELECT
                whatsAppSubscriptions.*,
                credentials.username,
                credentials.email,
                credentials.registeredBy,
                credentials.name,
                corporateUsers.packageId AS corporatePackageId,
                corporateUsers.contactPersonName,
                packages.packageName,
                packages.packageType,
                packages.packagePrices,
                packages.vendorPackagePrices,
                packages.discount
            FROM
                whatsAppSubscriptions
            JOIN
               corporateUsers ON whatsAppSubscriptions.corporateUserId = corporateUsers.id
            JOIN
                credentials ON whatsAppSubscriptions.credentialId = credentials.id
            JOIN
                packages ON whatsAppSubscriptions.packageId = packages.id
            WHERE
                whatsAppSubscriptions.status = 'ACTIVE'
                AND whatsAppSubscriptions.vendorSubscriptionId IS NULL
                AND DATE(DATE_SUB(whatsAppSubscriptions.subscriptionEndDate, INTERVAL 1 DAY)) = :today
        `;

        const activeWhatsAppSubscriptions = await sequelizeConfig.query(query, {
            replacements: { today },
            type: Sequelize.QueryTypes.SELECT,
        });

        // A credential can hold multiple simultaneous add-ons (e.g. Bot Builder + Shopify
        // Integration) — collect ALL isCustom rows for the base row's credential into a list
        // instead of overwriting a single addonDetails, otherwise a second add-on silently
        // drops out of the renewal amount / expiry / cancellation-email handling below.
        const processedSubscriptions = activeWhatsAppSubscriptions.reduce((acc, current) => {
            const existingEntry = acc.find(
                (entry) =>
                    entry.credentialId === current.credentialId && entry.isCustom === 0
            );

            if (existingEntry) {
                if (current.isCustom === 1) {
                    existingEntry.addonDetailsList.push({ ...current });
                }
            } else {
                acc.push({ ...current, addonDetailsList: [] });
            }

            return acc;
        }, []);
        
        console.dir(processedSubscriptions, { depth: null });

        if (activeWhatsAppSubscriptions.length === 0) return;

        const serviceDetails = await findServiceOperatorByAccessKey(accessKey);
        if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
            return;
        }
        customLog(null, "info", { message: "ServiceDetails", serviceDetails })
        let vendorUrl = serviceDetails.apiUrl;
        const outletReference = serviceDetails.optional1;

        const ADD_ON_LABELS = { BOT_BUILDER: 'Bot Builder', SHOPIFY_INTEGRATION: 'Shopify Integration' };

        processedSubscriptions.forEach(async (subscription) => {
            // forEach does not await async callbacks, so catch per item or the error is lost
            try {
            const { id, credentialId, corporateUserId, isCancelled, billingType, packagePrices, discount, corporatePackageId, addonDetailsList } = subscription;
            let pgAmount = 0
            if (billingType === "MONTHLY") {
                pgAmount = parseFloat(packagePrices.monthly) - parseFloat(discount.monthly)
            } else if (billingType === "ANNUALLY") {
                pgAmount = parseFloat(packagePrices.annually) - parseFloat(discount.annually)
            }

            // Fetch service details
            const whatsappServiceDetails = await fetchServiceDetails({
                credentialId,
                accessKey: whatsappAccessKey,
                packageId: corporatePackageId,
                corporateUserId
            });

            addonDetailsList.forEach((addonDetails) => {
                if (!addonDetails.isCancelled) {
                    pgAmount += parseFloat(addonDetails.subscriptionPrice)
                    return;
                }
                const adminEmails = whatsappServiceDetails.vendor.vendorEmail
                const { name } = subscription
                const addOnLabel = ADD_ON_LABELS[addonDetails.addOnType] || 'Bot Builder';
                const title = `${addOnLabel} add-on cancelled by ${name} `;
                const emailContent = emailTemplates.emailForBotDeactivation(name)
                adminEmails.map((adminEmail) => {
                     emailer.email(adminEmail, title, emailContent, function () {
                         customLog(null, "info", { message: "Email sent to " + adminEmail })
                     });
                 });
            });

            if (isCancelled) {
                await updateWhatsAppSubscriptionStatus(id, "CANCELLED");
                await stopBillingForProjectApi(subscription)
                customLog(null, "info", { message: "Whatsapp subscription cancelled" })
                return;
            }

            const idsToUpdate = addonDetailsList.length ? [id, ...addonDetailsList.map((a) => a.id)] : id;
            await updateWhatsAppSubscriptionStatus(idsToUpdate, 'EXPIRED');
            customLog(null, "info", { message: "Whatsapp subscription Expired" })

            const isCardExist = await checkSaveCardExists(corporateUserId);
            if (!isCardExist) {
                return;
            }

            let accessToken = await getAccessTokenForAutoPay(vendorUrl, accessKey);
            // createAutoPay charges paymentDetails.subscriptionPrice — override it with pgAmount
            // (base + all active add-ons) so the vendor charge isn't just the base plan price.
            // subscription itself is left untouched since it's reused below (createNewWhatsAppSubscription,
            // notifications) with its original base subscriptionPrice.
            const response = await createAutoPay({ vendorUrl, accessToken, outletReference }, { ...subscription, subscriptionPrice: pgAmount }, isCardExist);

            if (response && response.state === 'PURCHASED') {
                const nextBillingDate = await createNewWhatsAppSubscription(subscription, response);

                await reactivateProjectBillingApi(subscription);

                const { username, email, registeredBy } = subscription;
                const notificationData = {
                    notificationTitle: "WhatsApp Subscription Renewal Successful",
                    notificationBrief: `Your WhatsApp subscription auto-renewal was successful.`,
                    notificationTo: [username],
                    notificationCategory: "CORPORATE",
                    notificationBy: "ADMIN",
                };
                createNotification(notificationData);

                const to = email;
                const transactionId = new Date().valueOf();
                let partnerData;
                partnerData = await fetchPartnerDetails(registeredBy)
                const resolved = await resolveEmailTemplate({
                    key: EMAIL_TEMPLATE_KEYS.WHATSAPP_SUBSCRIPTION_SUCCESS,
                    service: EMAIL_TEMPLATE_SERVICES.SCHEDULER,
                    variables: {
                        name: username,
                        packageName: subscription.packageName,
                        billingType: (subscription.billingType || '').charAt(0).toUpperCase() + (subscription.billingType || '').slice(1).toLowerCase(),
                        amountPaid: parseFloat(subscription.subscriptionPrice),
                        transactionId: String(transactionId),
                        nextBillingDate: moment(nextBillingDate).format('MMMM D, YYYY'),
                        branding: partnerData?.branding || 'Peko',
                        website: partnerData?.website || 'https://www.peko.one',
                        ...v2LayoutVariables(partnerData),
                    },
                    fallback: () => emailTemplates.generateSubscriptionSuccessEmail(username, transactionId, subscription, partnerData, nextBillingDate),
                    fallbackSubject: "WhatsApp Subscription autorenewal successful",
                });
                await emailer.email(to, resolved.subject, resolved.html);
            } else {
                await stopBillingForProjectApi(subscription)
                const { email, name, registeredBy, packageName, billingType, subscriptionAmountPaid } = subscription;
                if (email) {
                    try {
                        // Branded partner logo/footer, matching the other subscription emails.
                        const partnerDetails = await fetchPartnerDetails(registeredBy)
                        const loginUrl = `${frontendBaseUrl}/auth/login`;
                        const subject = `Your ${packageName} subscription renewal failed`;
                        // createAutoPay() only returns a state ('PURCHASED' or not) - no decline
                        // reason is surfaced from the auto-pay API at this call site.
                        const failedReason = 'We were unable to process your subscription renewal payment';
                        const resolved = await resolveEmailTemplate({
                            key: EMAIL_TEMPLATE_KEYS.SUBSCRIPTION_RENEWAL_FAILURE,
                            service: EMAIL_TEMPLATE_SERVICES.SCHEDULER,
                            variables: {
                                name,
                                packageName,
                                billingType: (billingType || '').toLowerCase(),
                                payableAmount: subscriptionAmountPaid,
                                formattedDate: moment().format('YYYY-MM-DD'),
                                failedReason,
                                loginUrl,
                                branding: partnerDetails?.branding || 'Peko',
                                website: partnerDetails?.website || 'https://www.peko.one',
                                ...v2LayoutVariables(partnerDetails),
                            },
                            fallback: () => emailTemplates.generateSubscriptionFailureEmail(
                                name,
                                { packageName, billingType },
                                subscriptionAmountPaid,
                                partnerDetails,
                                loginUrl,
                                failedReason,
                            ),
                            fallbackSubject: subject,
                        });
                        await emailer.email(email, resolved.subject, resolved.html);
                    } catch (emailErr) {
                        customLog(null, "error", { message: "Failed to send WhatsApp subscription renewal-failed email", subscriptionId: id, email, error: emailErr?.message ?? emailErr });
                    }
                }
            }
            } catch (error) {
                customLog(null, "error", { message: "WhatsApp auto-renewal failed for subscription", subscriptionId: subscription?.id, error: error?.message || error });
            }
        });
    } catch (error) {
        customLog(null, "error", { message: "Error in auto-renewal for WhatsApp subscriptions:", error })
    }
};

const updateWhatsAppSubscriptionStatus = async (id, status) => {
    // id may be a single id or an array (base row + N add-on rows) — IN (:id) handles both via
    // Sequelize's array-replacement expansion; `= :id` would not work correctly for an array.
    const ids = Array.isArray(id) ? id : [id];
    const query = `
      UPDATE whatsAppSubscriptions
      SET status = :status
      WHERE id IN (:ids)
    `;
    await sequelizeConfig.query(query, {
        replacements: { ids, status },
        type: Sequelize.QueryTypes.UPDATE,
    });
};

// const updateWhatsAppSubscriptionToBasic = async (credentialId) => {
//     const query = `
//       UPDATE whatsAppSubscriptions
//       SET status = "ACTIVE"
//       WHERE credentialId = :credentialId
//       AND subscriptionPaymentRefId IS NULL
//     `;
//     await sequelizeConfig.query(query, {
//         replacements: { credentialId },
//         type: Sequelize.QueryTypes.UPDATE,
//     });
// };

const createAutoPay = async (vendorData, subscription, userCard) => {
    const { vendorUrl, outletReference, accessToken } = vendorData

    const { subscriptionPrice, name, email, city } = subscription
    // create order using tokenisation method
    const config = {
        method: 'POST',
        url: `${vendorUrl}/transactions/outlets/${outletReference}/orders`,
        headers: {
            'Content-Type': 'application/vnd.ni-payment.v2+json',
            'Accept': 'application/vnd.ni-payment.v2+json',
            'Authorization': `Bearer ${accessToken}`
        },
        data: {
            "action": "PURCHASE",
            "amount": {
                "currencyCode": "INR",
                "value": parseFloat(subscriptionPrice)
            },
            "emailAddress": email,
            "billingAddress": {
                "firstName": name,
                "city": city,
                "countryCode": "AE"
            },
            "merchantAttributes": {
                "skip3DS": true
            },
            "skipConfirmationPage": true
        }
    };
    try {
        const response = await axios.request(config)
        const responseData = response.data
        if (responseData.reference && Object.prototype.hasOwnProperty.call(responseData._embedded, 'payment')) {
            const paymentLinks = responseData._embedded.payment[0]
            const tokenPaymentUrl = paymentLinks._links["payment:saved-card"].href
            // final api call for payment
            const config = {
                method: 'PUT',
                url: tokenPaymentUrl,
                headers: {
                    'Content-Type': 'application/vnd.ni-payment.v2+json',
                    'Authorization': `Bearer ${accessToken}`
                },
                data: {
                    ...userCard,
                    "recaptureCsc": false
                }
            };
            const response = await axios.request(config)
            return response.data
        }
        return false
    } catch (error) {
        customLog(null, "error", { error, message: "CreateAutoPay" }, "VENDOR")
        return false
    }
}

const findServiceOperatorByAccessKey = async (accessKey) => {
    let query = `
    SELECT 
        serviceOperators.*, 
        vendors.apiUrl, 
        vendors.optional1, 
        vendors.optional2, 
        vendors.optional3, 
        vendors.optional4, 
        vendors.optional5, 
        vendors.healthUrl
    FROM 
        serviceOperators
    JOIN 
        vendors ON serviceOperators.vendorId = vendors.id
    WHERE 
        serviceOperators.accessKey = :accessKey
    `;
    query += ' LIMIT 1';
    const replacements = { accessKey };
    const results = await sequelizeConfig.query(query, {
        replacements,
        type: Sequelize.QueryTypes.SELECT,
        raw: true,
        nest: true,
    });
    if (results.length === 0) {
        return { error: "Service is not available" };
    } else {
        return results[0];
    }
}

const createNewWhatsAppSubscription = async (subscription, response) => {
    const corporateTxnId = new Date().valueOf();
    const { subscriptionPrice, credentialId,corporateUserId, packageId,projectId,billingPlan, billingType } = subscription;
    const subscriptionStartDate = moment().startOf('day').toDate();
    let subscriptionEndDate;

    if (billingType === "MONTHLY") {
        subscriptionEndDate = moment().add(30, 'days').endOf('day').toDate();
    } else if (billingType === "ANNUALLY") {
        subscriptionEndDate = moment().add(365, 'days').endOf('day').toDate();
    }

    const newSubscription = {
        subscriptionStartDate,
        subscriptionEndDate,
        subscriptionPaymentRefId: corporateTxnId,
        subscriptionPrice,
        subscriptionAmountPaid: subscriptionPrice,
        corporateUserId,
        credentialId,
        packageId,
        projectId,
        discount: 0,
        billingType,
        billingPlan,
        paymentModeResponse: JSON.stringify(response),
        createdAt: new Date(),
        updatedAt: new Date(),
        status: "ACTIVE",
    };

    const query = `
      INSERT INTO whatsAppSubscriptions (
          subscriptionStartDate,
          subscriptionEndDate,
          subscriptionPaymentRefId,
          subscriptionPrice,
          subscriptionAmountPaid,
          credentialId,
          corporateUserId,
          packageId,
          projectId,
          discount,
          billingType,
          billingPlan,
          paymentModeResponse,
          status,
          createdAt,
          updatedAt
      ) VALUES (
          :subscriptionStartDate,
          :subscriptionEndDate,
          :subscriptionPaymentRefId,
          :subscriptionPrice,
          :subscriptionAmountPaid,
          :credentialId,
          :corporateUserId,
          :packageId,
          :projectId,
          :discount,
          :billingType,
          :billingPlan,
          :paymentModeResponse,
          :status,
          :createdAt,
          :updatedAt
      )
    `;
    await sequelizeConfig.query(query, {
        replacements: newSubscription,
        type: Sequelize.QueryTypes.INSERT,
    });
    return subscriptionEndDate;
};

const checkSaveCardExists = async (corporateUserId) => {
    if (!corporateUserId) {
        customLog(null, "error", { message: "checkSaveCardExists called with null/undefined corporateUserId — skipping" });
        return null;
    }
    const query = `
      SELECT * FROM saved_cards
      WHERE corporateUserId = :corporateUserId AND is_default = true
      LIMIT 1
      `;
    const results = await sequelizeConfig.query(query, {
        replacements: { corporateUserId },
        type: Sequelize.QueryTypes.SELECT
    });
    return results.length > 0 ? results[0] : null;
}


const reactivateProjectBillingApi = async (subscription) => {
    try {
        const whatsappAccessKey = operatorsData["whatsAppForBusiness"]["accessKey"]
        const { projectId, billingType,billingPlan, } = subscription;

        const activePlan = getActivePlan(billingType, billingPlan);

        const vendor = await findServiceOperatorByAccessKey(whatsappAccessKey);
        if (Object.prototype.hasOwnProperty.call(vendor, 'error')) {
            return;
        }

        const { optional1: API_Key, optional2: PartnerId, apiUrl: URL, optional4: familyId } = vendor;

        let config = {
            method: 'patch',
            url: `${URL}/partner/${PartnerId}/project/${projectId}/billing/reactivate-project`,
            headers: {
                'Content-Type': 'application/json',
                'X-AiSensy-Partner-API-Key': `${API_Key}`
            },
            data: {
                "familyId": `${familyId}`,
                "defaultPlan": `${activePlan}`
            }
        };

        let result = await axios(config);

        let data = result?.data
        if (!data) throw new Error('Error in api call')

        return { status: true, message: 'success', data: data }
    } catch (error) {
        customLog(null, "error", { error: error?.response ?? error }, "VENDOR")
        return { status: false, message: 'Something went wrong while reactivating project billing', data: error?.response?.data }
    }
};

const stopBillingForProjectApi = async (subscription) => {
    const whatsappAccessKey = operatorsData["whatsAppForBusiness"]["accessKey"]
    const { projectId } = subscription;

    const vendor = await findServiceOperatorByAccessKey(whatsappAccessKey);
    if (Object.prototype.hasOwnProperty.call(vendor, 'error')) {
        return;
    }
    customLog(null, "info", { message: "VendorDetails", vendor })

    const { optional1: API_Key, optional2: PartnerId, apiUrl: URL } = vendor;
    try {
        const config = {
            method: 'patch',
            url: `${URL}/partner/${PartnerId}/stop-project-billing/${projectId}`,
            headers: {
                'Content-Type': 'application/json',
                'X-AiSensy-Partner-API-Key': `${API_Key}`
            },
        };
        const result = await axios(config);
        customLog(null, "info", { message: "Stop project billing response", data: result?.data || result }, "VENDOR")

        let data = result?.data
        if (!data) throw new Error('Error in api call')

        return { status: true, message: 'success', data: data }
    } catch (error) {
        customLog(null, "error", { message: error?.message, data: error?.response?.data })
        // let message = error?.response?.data?.message
        return { status: false, message: 'Something went wrong while stop project billing', data: error?.response?.data }
    }
};

const getActivePlan = (billingType, billingPlan) => {
    if (!billingType || !billingPlan) {
        throw new Error("Billing type and billing plan are required to determine the active plan.");
    }
    
    // Normalize billingType to handle both "ANNUALLY" and "YEARLY"
    let type = billingType.toUpperCase();
    if (type === 'ANNUALLY') {
        type = 'YEARLY';
    }

    // Convert the billingPlan to uppercase
    const plan = billingPlan.toUpperCase();
    
    // Return the combined active plan
    return `${plan}_${type}`;
};



