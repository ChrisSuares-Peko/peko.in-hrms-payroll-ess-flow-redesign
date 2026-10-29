const sequelizeConfig = require("../configs/database/index");
const Sequelize = require("sequelize");
const emailer = require('../utils/emailer');
const emailTemplates = require('../utils/emailTemplates');
const { createNotification } = require("../models/use-cases/notification");
const { fetchPartnerDetails } = require("../models/use-cases/systemUser");
const { calculatePlanAmount } = require("./triggerSubscriptionCharges");
const { formatNumberWithLocalString } = require("../utils/formatter");
const { resolveEmailTemplate } = require("./emailTemplateResolver");
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require("../utils/emailTemplateKeys");
const { v2LayoutVariables } = require("../utils/emailTemplate/sharedLayout");
const { customLog } = require("../utils/loggerHelper");

const DateOnlyConfig = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
};

exports.subscriptionPreReminder = async (day) => {
    try {
        const query = `
            SELECT
                subscriptions.id,
                subscriptions.corporateUserId,
                subscriptions.subscriptionEndDate,
                subscriptions.billingType,
                subscriptions.paymentMode,
                corporateUsers.email,
                corporateUsers.name,
                credentials.username,
                credentials.registeredBy,
                packages.packageName,
                packages.packageType,
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
                subscriptions.status = 'ACTIVE'
                AND DATE(subscriptions.subscriptionEndDate) = DATE(DATE_ADD(CURDATE(), INTERVAL ${day} DAY))
                AND subscriptions.isCustom = false;
        `;

        const results = await sequelizeConfig.query(query, {
            type: Sequelize.QueryTypes.SELECT,
        });


        if (results.length === 0) {
            return;
        }

        results.forEach(async (result) => {
            // forEach does not await async callbacks, so catch per item or the error is lost
            try {
            const date = new Date(result.subscriptionEndDate);
            const endDate = date.toLocaleString('en-US', DateOnlyConfig);
            const isActivationCode = result.paymentMode === 'ACTIVATION_CODE';

            // Renewal total = plan + recurring (isDynamicUnitPricing) addons, computed via the
            // same calculatePlanAmount that triggerSubscriptionCharges charges with — so the
            // reminder reflects the real amount including Payroll-type addons. Only for
            // auto-renew plans; on failure we fall back to omitting the amount.
            let renewalAmountText = null;
            if (!isActivationCode) {
                try {
                    const pkg = {
                        packageType: result.packageType,
                        packagePrices: typeof result.packagePrices === 'string' ? JSON.parse(result.packagePrices) : result.packagePrices,
                        discount: typeof result.discount === 'string' ? JSON.parse(result.discount) : result.discount,
                    };
                    const { periodicPrice } = await calculatePlanAmount(pkg, result.billingType, false, null, null, result.corporateUserId);
                    if (periodicPrice != null && !Number.isNaN(Number(periodicPrice))) {
                        renewalAmountText = `₹${formatNumberWithLocalString(periodicPrice)}`;
                    }
                } catch (error) {
                    console.error('Error computing renewal amount for pre-reminder:', error);
                }
            }

            const notification = isActivationCode
                ? `Your ${result.packageName} subscription expires on ${endDate}. Please renew to avoid service interruptions.`
                : `Your ${result.packageName} subscription is set to renew on ${endDate}${renewalAmountText ? ` for ${renewalAmountText}` : ''}. Ensure your payment card is active and has sufficient funds to avoid service interruptions.`;

            const notificationData = {
                notificationTitle: isActivationCode ? "Subscription Expiring Soon" : "Subscription Renewal",
                notificationBrief: notification,
                notificationTo: [result.username],
                notificationCategory: "CORPORATE",
                notificationBy: "ADMIN",
            };

            let partnerDetails;
            partnerDetails = await fetchPartnerDetails(result?.registeredBy);
            createNotification(notificationData);
            const to = result.email;
            const subject = isActivationCode
                ? `Your ${result.packageName} Subscription is Expiring Soon!`
                : `Your ${result.packageName} Subscription is Renewing Soon!`;

            // Mirrors preReminderTemplate's own derivation exactly, so the admin-edited
            // path renders identically to the JS fallback.
            const billingLabel = result.billingType ? result.billingType.toLowerCase() : '';
            const heading = isActivationCode
                ? `Your ${result.packageName} subscription expires on ${endDate}`
                : `Your ${result.packageName} subscription is renewing on ${endDate}`;
            const bodyText = isActivationCode
                ? `We wanted to let you know that your <strong>${result.packageName} ${billingLabel}</strong> subscription expires on <strong>${endDate}</strong>. To continue enjoying uninterrupted access to premium services, please log in and renew your subscription before it expires.`
                : `We wanted to let you know that your <strong>${result.packageName} ${billingLabel}</strong> subscription is set to automatically renew on <strong>${endDate}</strong>. Please ensure your payment card is active and has sufficient funds to avoid any service interruptions.`;
            const dateLabel = isActivationCode ? 'Expiry Date' : 'Renewal Date';
            // Never a bare '' - an empty placeholder would make the resolver discard the
            // whole DYNAMIC template, and renewalAmountText is legitimately null whenever
            // isActivationCode is true or the price calculation above fails.
            const renewalAmountHtml = renewalAmountText
                ? `<div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;padding-bottom:8px;"><strong>Renewal Amount:</strong> ${renewalAmountText}</div>`
                : '<!-- no renewal amount available -->';

            const resolved = await resolveEmailTemplate({
                key: EMAIL_TEMPLATE_KEYS.SUBSCRIPTION_PRE_REMINDER,
                service: EMAIL_TEMPLATE_SERVICES.SCHEDULER,
                variables: {
                    heading,
                    name: result.name || 'Subscriber',
                    bodyText,
                    packageName: result.packageName,
                    billingLabel,
                    renewalAmountHtml,
                    dateLabel,
                    endDate,
                    branding: partnerDetails?.branding || 'Peko',
                    website: partnerDetails?.website || 'https://www.peko.one',
                    ...v2LayoutVariables(partnerDetails),
                },
                fallback: () => emailTemplates.preReminderTemplate(result, partnerDetails, renewalAmountText),
                fallbackSubject: subject,
                partnerId: result?.registeredBy || null,
            });
            await emailer.email(to, resolved.subject, resolved.html);
             } catch (error) {
                customLog(null, "error", { message: "Pre-reminder failed for subscription", subscriptionId: result?.id, error: error?.message || error });
            }
        });
    } catch (error) {
        console.error('Error checking pre-reminders:', error);
    }
};

