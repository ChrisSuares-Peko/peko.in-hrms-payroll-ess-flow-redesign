const sequelize = require('./../configs/database/index');
const Package = require("../models/entities/package");
const WhatsAppSubscription = require("../models/entities/whatsappSubscription");
const credential = require("../models/entities/credential");
const corporateUser = require("../models/entities/corporateUser");
const { Op } = require('sequelize');
const orders = require('../models/entities/order');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const { emailForBotActivated, emailForShopifyIntegrationActivated } = require('./emailTemplates/whatsappforBusiness');
const emailer = require('./emailer');
const { customLog } = require('./loggerHelper');
const { applyCommissionMarkup, PLAN_COMMISSION } = require('./applyCommissionMarkup');

// Marker used in `projectId` for bundled WhatsApp rows that haven't had their AiSensy
// project created yet. Frontend detects this on the WhatsApp landing page and calls
// `POST /whatsapp/initialize-bundled-project` to spin up the project on first visit.
// (`projectId` is NOT NULL on the entity, so we can't store null — pick a stable sentinel.)
const PENDING_PROJECT_ID = 'PENDING';

// Splits an amount (coupon or platform fee) over the plan and add-on rows by price; the last priced row takes the rounding.
const splitByShare = (value, prices, capAtTotal = false) => {
  const weights = prices.map((p) => Math.max(0, Number(p) || 0));
  const total = weights.reduce((sum, w) => sum + w, 0);
  const amount = capAtTotal ? Math.min(Number(value) || 0, total) : Number(value) || 0;
  const last = weights.map((w) => w > 0).lastIndexOf(true);
  if (!(amount > 0) || last < 0) return weights.map(() => 0);
  let allocated = 0;
  return weights.map((w, i) => {
    if (w <= 0) return 0;
    const share = i === last ? Number((amount - allocated).toFixed(2)) : Number(((amount * w) / total).toFixed(2));
    allocated += share;
    return share;
  });
};

function formatSubscription(subscriptionPlan, duration) {
  try {
  // Determine the formatted duration based on the provided value
  let formattedDuration = duration.toUpperCase()

  let formattedPlan;
  if (subscriptionPlan.toLowerCase() === "whatsapp pro") {
  formattedPlan = 'PRO';
  } else if (subscriptionPlan.toLowerCase() === "whatsapp basic") {
    formattedPlan = 'BASIC';
  } else {
      throw new Error('Invalid subscription plan');
  }

  // Combine the plan and duration into the required format

  return { formattedPlan,formattedDuration };
  } catch (error) {
      return { status: false, message: error?.message, plan: '' };
  }
  // Convert the subscription plan to uppercase
 
}

exports.createWhatsApSubscription = async (data) => {
  let transaction;
  try {
    transaction = await sequelize.transaction();

    const { packageId, pgAmount,botBuilder, shopifyIntegration, corporateId,credentialId, corporateTxnId, serviceOperatorId, subscriptionPlan,subscriptionDuration, paymentGatewayResponse ,project_id, reportData, surcharge, couponTotalDiscount } = data;
    const formattedSubscription = formatSubscription(subscriptionPlan,subscriptionDuration)
    // pgAmount is the PG total (plan + platform fee + add-ons) — keep the fee out of the plan row
    const amount = pgAmount - Number(surcharge || 0) - (botBuilder || 0) - (shopifyIntegration || 0)

    const billingPlan = formattedSubscription.formattedPlan
    const billingType = formattedSubscription.formattedDuration
    const isExistingSubscription = await WhatsAppSubscription.findOne({
      include: [{ model: Package }],
      where: {
        packageId: packageId,
        credentialId: credentialId,
        status: 'ACTIVE',
        billingType: {
          [Op.eq]: billingType
        }
      },
      raw: true,
      nest: true
    });

    if (isExistingSubscription) {
      return {
        error: true,
        message: `User already has the ${isExistingSubscription.package.packageName} subscription plan.`
      };
    }

    const packageDetails = await Package.findOne({
      where: { id: packageId },
      attributes: ['id', 'packageName', 'packagePrices', 'discount', 'packageType', ...PLAN_COMMISSION.fields, 'planCommissions'],
      raw: true,
      nest: true
    });

    if (!packageDetails) {
      return {
        error: true,
        message: "Invalid package details"
      };
    }

    await applyCommissionMarkup(packageDetails, "packagePrices.monthly", credentialId);
    await applyCommissionMarkup(packageDetails, "packagePrices.annually", credentialId);

    const packagePrices = packageDetails.packagePrices;

    let packagePrice = 0
    let discountPrice = 0

    const subscriptionStartDate = moment().startOf('day').toDate()
    let subscriptionEndDate
    if (billingType === "MONTHLY") {
      packagePrice = packagePrices.monthly
      discountPrice = packageDetails.discount.monthly
      subscriptionEndDate = moment().add(30, 'days').endOf('day').toDate()
    } else if (billingType === "ANNUALLY") {
      packagePrice = packagePrices.annually
      discountPrice = packageDetails.discount.annually
      subscriptionEndDate = moment().add(365, 'days').endOf('day').toDate()
    } else {
      return {
        error: true,
        message: "Invalid billing type"
      };
    }

    const [planCoupon, botBuilderCoupon, shopifyCoupon] = splitByShare(couponTotalDiscount, [Number(packagePrice) - Number(discountPrice), botBuilder, shopifyIntegration], true);
    let totalDiscount = Number(discountPrice) + planCoupon

    const newSubscription = {
      subscriptionStartDate: subscriptionStartDate,
      subscriptionEndDate: subscriptionEndDate,
      subscriptionPaymentRefId: corporateTxnId,
      subscriptionPrice: packagePrice,
      subscriptionAmountPaid: amount,
      corporateUserId: corporateId,
      packageId: packageId,
      credentialId,
      discount: totalDiscount,
      billingType: billingType,
      billingPlan,
      paymentModeResponse: JSON.stringify([paymentGatewayResponse]),
      projectId: project_id,
  };
  
  const subscriptions = [newSubscription]; // Initialize with the main subscription

  if (botBuilder) {
      const botBuilderSubscription = {
          subscriptionStartDate: subscriptionStartDate,
          subscriptionEndDate: subscriptionEndDate,
          subscriptionPaymentRefId: corporateTxnId,
          subscriptionPrice: botBuilder,
          subscriptionAmountPaid: botBuilder,
          corporateUserId: corporateId,
          packageId: packageId,
          credentialId,
          discount: botBuilderCoupon,
          billingType: billingType,
          billingPlan: 'BASIC',
          isCustom: true,
          addOnType: 'BOT_BUILDER',
          paymentModeResponse: JSON.stringify([paymentGatewayResponse]),
          projectId: project_id,
      };

      subscriptions.push(botBuilderSubscription); // Add the botBuilder subscription
  }
  if (shopifyIntegration) {
      const shopifyIntegrationSubscription = {
          subscriptionStartDate: subscriptionStartDate,
          subscriptionEndDate: subscriptionEndDate,
          subscriptionPaymentRefId: corporateTxnId,
          subscriptionPrice: shopifyIntegration,
          subscriptionAmountPaid: shopifyIntegration,
          corporateUserId: corporateId,
          packageId: packageId,
          credentialId,
          discount: shopifyCoupon,
          billingType: billingType,
          billingPlan: 'BASIC',
          isCustom: true,
          addOnType: 'SHOPIFY_INTEGRATION',
          paymentModeResponse: JSON.stringify([paymentGatewayResponse]),
          projectId: project_id,
      };

      subscriptions.push(shopifyIntegrationSubscription); // Add the Shopify Integration subscription
  }
  // Create both subscriptions in bulk
  const createdSubscriptions =  await WhatsAppSubscription.bulkCreate(subscriptions, {
    transaction,
    returning: true, // Return created records including IDs
});

const responseSubscription = createdSubscriptions.filter(
  (subscription) => !subscription.isCustom
);

    const orderDetailsPayload = {
      ...newSubscription,
      serviceName: packageDetails.packageName
    };
    delete orderDetailsPayload.paymentModeResponse;

     await orders.create({
      corporateTxnId: corporateTxnId,
      operatorId: uuidv4(),
      corporateId: credentialId,
      transactionDate: new Date(),
      amountInINR: parseFloat(pgAmount),
      baseAmount: parseFloat(pgAmount),
      baseCurrency: 'INR',
      exchangeRate: 1,
      status: 'SUCCESS',
      paymentMode: 'PAYMENT GATEWAY',
      paymentModeResponse: JSON.stringify([{ ...paymentGatewayResponse, pgAmount: parseFloat(pgAmount) }]),
      accountNo: null,
      surcharge: Number(surcharge || 0),
      serviceOperatorId,
      credentialId,
      subCorporateUserId: null,
      orderResponse: JSON.stringify(orderDetailsPayload),
      message: 'Payment Successful',
      optional: 'WHATSAPP-SUBSCRIPTION',
      ...reportData
    }, {
      transaction: transaction
    });

    await transaction.commit();
    return { 
      subscription: {
          ...responseSubscription[0]?.get({ plain: true }),
          subscriptionAmountPaid: parseFloat(pgAmount) 
      },
      packageDetails,
  };
    

  } catch (error) {
    console.log("Subscription error:", error);
    await transaction.rollback();
    return {
      error: true,
      message: "something went wrong "
    };
  }
};
  
  exports.updateWhatsAppSubscription = async (data) => {
    let transaction;
    try {
        transaction = await sequelize.transaction();

        const {
            packageId,
            pgAmount,
            botBuilder,
            shopifyIntegration,
            corporateId,
            credentialId,
            corporateTxnId,
            serviceOperatorId,
            subscriptionPlan,
            subscriptionDuration,
            paymentGatewayResponse,
            project_id,
            reportData,
            surcharge,
            couponTotalDiscount,
            subscriptionDiscountPrice,
            addOndiscountPrice,
            shopifyAddOndiscountPrice,
        } = data;
        const formattedSubscription = formatSubscription(subscriptionPlan, subscriptionDuration);
        // pgAmount is the PG total (plan + platform fee + add-ons) — keep the fee out of the plan row
        const amount = Number(pgAmount) - Number(surcharge || 0) - Number(botBuilder || 0) - Number(shopifyIntegration || 0);
        const billingPlan = formattedSubscription.formattedPlan;
        const billingType = formattedSubscription.formattedDuration;
        const packageDetails = await Package.findOne({
            where: { id: packageId },
            attributes: ['id', 'packageName', 'packagePrices', 'discount', 'packageType', ...PLAN_COMMISSION.fields, 'planCommissions'],
            raw: true,
            nest: true,
        });

        if (!packageDetails) {
            return {
                error: true,
                message: "Invalid package details",
            };
        }

        await applyCommissionMarkup(packageDetails, "packagePrices.monthly", credentialId);
        await applyCommissionMarkup(packageDetails, "packagePrices.annually", credentialId);

        const packagePrices = packageDetails.packagePrices;

        const subscriptionStartDate = moment().startOf('day').toDate();
         let subscriptionEndDate;
                let discountPrice = 0
                let packagePrice = 0
        
                if (billingType === "MONTHLY") {
                    subscriptionEndDate = moment().add(30, 'days').endOf('day').toDate();
                    discountPrice = parseFloat(packageDetails.discount.monthly)
                    packagePrice = parseFloat(packagePrices.monthly)
                } else if (billingType === "ANNUALLY") {
                    subscriptionEndDate = moment().add(365, 'days').endOf('day').toDate();
                    discountPrice = parseFloat(packageDetails.discount.annually)
                    packagePrice = parseFloat(packagePrices.annually)
                } else {
                    return {
                        error: true,
                        message: "Invalid billing type",
                    };
           }

        const [planCoupon, botBuilderCoupon, shopifyCoupon] = splitByShare(couponTotalDiscount, [
            Number(packagePrice) - Number(discountPrice) - Number(subscriptionDiscountPrice || 0),
            (Number(botBuilder) || 0) - Number(addOndiscountPrice || 0),
            (Number(shopifyIntegration) || 0) - Number(shopifyAddOndiscountPrice || 0),
        ], true);
        const totalDiscount = Number(discountPrice) + planCoupon;

        const newSubscription = {
            subscriptionStartDate: subscriptionStartDate,
            subscriptionEndDate: subscriptionEndDate,
            subscriptionPaymentRefId: corporateTxnId,
            subscriptionPrice: packagePrice,
            subscriptionAmountPaid: amount,
            corporateUserId: corporateId,
            packageId: packageId,
            credentialId,
            status:'ACTIVE',
            discount: totalDiscount,
            billingType: billingType,
            billingPlan,
            paymentModeResponse: JSON.stringify([paymentGatewayResponse]),
            projectId: project_id,
        };

        const subscriptions = [newSubscription]; // Initialize with the main subscription

        if (botBuilder) {
            const botBuilderSubscription = {
                ...newSubscription,
                billingPlan: 'BASIC',
                subscriptionPrice: botBuilder,
                subscriptionAmountPaid: botBuilder,
                discount: botBuilderCoupon,
                isCustom: true,
                addOnType: 'BOT_BUILDER',
            };

            subscriptions.push(botBuilderSubscription); // Add the botBuilder subscription
        }
        if (shopifyIntegration) {
            const shopifyIntegrationSubscription = {
                ...newSubscription,
                billingPlan: 'BASIC',
                subscriptionPrice: shopifyIntegration,
                subscriptionAmountPaid: shopifyIntegration,
                discount: shopifyCoupon,
                isCustom: true,
                addOnType: 'SHOPIFY_INTEGRATION',
            };

            subscriptions.push(shopifyIntegrationSubscription); // Add the Shopify Integration subscription
        }

        // Create new subscriptions
        const createdSubscriptions = await WhatsAppSubscription.bulkCreate(subscriptions, {
            transaction,
            returning: true, // Return created records including IDs
        });

        const responseSubscription = createdSubscriptions.filter(
            (subscription) => !subscription.isCustom
        );

        const orderDetailsPayload = {
            ...newSubscription,
            serviceName: packageDetails.packageName,
        };
        delete orderDetailsPayload.paymentModeResponse;

        await orders.create(
            {
                corporateTxnId: corporateTxnId,
                operatorId: uuidv4(),
                corporateId: credentialId,
                transactionDate: new Date(),
                amountInINR: parseFloat(pgAmount),
                baseAmount: parseFloat(pgAmount),
                baseCurrency: 'INR',
                exchangeRate: 1,
                status: 'SUCCESS',
                paymentMode: 'PAYMENT GATEWAY',
                paymentModeResponse: JSON.stringify([{ ...paymentGatewayResponse, pgAmount: parseFloat(pgAmount) }]),
                accountNo: null,
                surcharge: Number(surcharge || 0),
                serviceOperatorId,
                credentialId,
                subCorporateUserId: null,
                orderResponse: JSON.stringify(orderDetailsPayload),
                message: 'Payment Successful',
                optional: 'WHATSAPP-SUBSCRIPTION',
                ...reportData
            },
            { transaction }
        );

        await transaction.commit();

        return { 
          subscription: {
            ...responseSubscription[0]?.get({ plain: true }),
            subscriptionAmountPaid: parseFloat(pgAmount) 
        }, 
          packageDetails, 
        };
        
    } catch (error) {
        console.log("Subscription error:", error);
        if (transaction) await transaction.rollback();
        return {
            error: true,
            message: "Something went wrong",
        };
    }
};


exports.createBotBuilderSubscription = async (data,corporateUserId,credentialId,corporateTxnId, serviceOperatorId, project_id,vendor,name,reportData) => {
    let transaction;
    let committed = false;
    try {
      transaction = await sequelize.transaction();
  
      const { pgAmount, paymentGatewayResponse, addOnType: rawAddOnType, surcharge, amount, couponTotalDiscount } = data;
      // Back-compat: existing callers (FE not yet sending addOnType) purchase Bot Builder.
      const addOnType = rawAddOnType === 'SHOPIFY_INTEGRATION' ? 'SHOPIFY_INTEGRATION' : 'BOT_BUILDER';
      const { vendorEmail:adminEmails } = vendor;

      const isExistingSubscription = await WhatsAppSubscription.findOne({
        include: [{ model: Package }],
        where: {
          credentialId: credentialId,
          status: 'ACTIVE',
          projectId:project_id,
          isCustom:false
        },
        raw: true,
        nest: true
      });
      const packageDetails = await Package.findOne({
        where: { id: isExistingSubscription.packageId },
        attributes: ['id', 'packageName', 'packagePrices', 'discount', 'packageType'],
        raw: true,
        nest: true
      });

      if (!packageDetails) {
        return {
          error: true,
          message: "Invalid package details"
        };
      }

      const newSubscription = {
        subscriptionStartDate: new Date(),
        subscriptionEndDate: isExistingSubscription.subscriptionEndDate,
        subscriptionPaymentRefId: corporateTxnId,
        subscriptionPrice: Number(amount),
        subscriptionAmountPaid: Number(pgAmount),
        corporateUserId: corporateUserId,
        packageId: isExistingSubscription.packageId,
        credentialId,
        isCustom: true,
        addOnType,
        discount: Number(couponTotalDiscount) || 0,
        status: 'ACTIVE',
        billingType: isExistingSubscription.billingType,
        billingPlan: 'BASIC',
        paymentModeResponse: JSON.stringify([paymentGatewayResponse]),
        projectId: isExistingSubscription.projectId,
    };

    const subscription = await WhatsAppSubscription.create(newSubscription, { transaction: transaction });
    
      const orderDetailsPayload = {
        ...newSubscription,
        serviceName: packageDetails.packageName
      };
      delete orderDetailsPayload.paymentModeResponse;

      await orders.create({
        corporateTxnId: corporateTxnId,
        operatorId: uuidv4(),
        corporateId: credentialId,
        transactionDate: new Date(),
        amountInINR: parseFloat(pgAmount),
        baseAmount: parseFloat(pgAmount),
        baseCurrency: 'INR',
        exchangeRate: 1,
        status: 'SUCCESS',
        paymentMode: 'PAYMENT GATEWAY',
        paymentModeResponse: JSON.stringify([{ ...paymentGatewayResponse, pgAmount: parseFloat(pgAmount) }]),
        accountNo: null,
        surcharge: Number(surcharge || 0),
        serviceOperatorId,
        credentialId,
        subCorporateUserId: null,
        orderResponse: JSON.stringify(orderDetailsPayload),
        message: 'Payment Successful',
        optional: 'WHATSAPP-SUBSCRIPTION',
        ...reportData
      }, {
        transaction: transaction
      });

      
      await transaction.commit();
      committed = true;

      // Post-commit side-effect: notify admins. NON-FATAL — the add-on is already committed,
      // so a failure here must not roll back or fail the purchase. vendor.vendorEmail (adminEmails)
      // can be null/missing for some service operators, so guard before iterating (this was
      // throwing "Cannot read properties of null (reading 'map')" after commit and surfacing the
      // purchase as failed).
      try {
        if (subscription && subscription.isCustom === true && Array.isArray(adminEmails)) {
          const isShopify = addOnType === 'SHOPIFY_INTEGRATION';
          const title = `${isShopify ? 'Shopify Integration' : 'Bot Builder'} add-on purchased by ${name} `;
          const emailContent = isShopify ? emailForShopifyIntegrationActivated(name) : emailForBotActivated(name)
          adminEmails.forEach((adminEmail) => {
            emailer.email({ to: adminEmail, subject: title, body: emailContent }, function () {
              console.log("Email sent to " + adminEmail)
            });
          });
        }
      } catch (emailErr) {
        console.log("Add-on admin email failed (non-fatal):", emailErr?.message ?? emailErr);
      }

      return {
        subscription,
        packageDetails,
    };

    } catch (error) {
      console.log("Subscription error:", error);
      // Only roll back if the commit has NOT happened — rolling back an already-committed
      // transaction throws "Transaction cannot be rolled back ... state: commit", masking the
      // real error and failing the request even though the row was saved.
      if (transaction && !committed) await transaction.rollback();
      return { status: false, message: 'Error updating add-on amount.', error: error.message };
    }
  };
// ─── Cashfree mandate / webhook helpers ──────────────────────────────────────

exports.createWhatsAppSubscriptionFromWebhook = async (tags, projectId, vendorSubscriptionId, serviceOperatorId = null, reportData = {}) => {
  let transaction;
  try {
    transaction = await sequelize.transaction();
    const {
      credentialId,
      corporateId: corporateUserId,
      packageId,
      subscriptionPlan,
      subscriptionDuration,
      botBuilder: botBuilderStr,
      shopifyIntegration: shopifyIntegrationStr,
      pgAmount: pgAmountStr,
      surcharge: surchargeStr,
      couponTotalDiscount,
      subscriptionDiscountPrice,
      addOndiscountPrice,
      shopifyAddOndiscountPrice,
      isUpgrade,
      mainSubId,
    } = tags;

    const pgAmount = parseFloat(pgAmountStr || 0);
    const surcharge = parseFloat(surchargeStr || 0) || 0;
    const botBuilder = parseFloat(botBuilderStr || 0) || null;
    const shopifyIntegration = parseFloat(shopifyIntegrationStr || 0) || null;

    const formatted = formatSubscription(subscriptionPlan, subscriptionDuration);
    if (!formatted.formattedPlan) {
      return { error: true, message: `Invalid subscription plan/duration: ${subscriptionPlan} / ${subscriptionDuration}` };
    }
    const billingPlan = formatted.formattedPlan;
    const billingType = formatted.formattedDuration;

    const packageDetails = await Package.findOne({
      where: { id: packageId },
      attributes: ['id', 'packageName', 'packagePrices', 'discount', ...PLAN_COMMISSION.fields, 'planCommissions'],
      raw: true,
    });
    if (!packageDetails) return { error: true, message: 'Package not found' };
    await applyCommissionMarkup(packageDetails, "packagePrices.monthly", credentialId);
    await applyCommissionMarkup(packageDetails, "packagePrices.annually", credentialId);

    const packagePrice = billingType === 'MONTHLY'
      ? parseFloat(packageDetails.packagePrices.monthly)
      : parseFloat(packageDetails.packagePrices.annually);
    const discount = billingType === 'MONTHLY'
      ? parseFloat(packageDetails.discount.monthly)
      : parseFloat(packageDetails.discount.annually);

    const subscriptionStartDate = moment().startOf('day').toDate();
    const subscriptionEndDate = billingType === 'MONTHLY'
      ? moment().add(30, 'days').endOf('day').toDate()
      : moment().add(365, 'days').endOf('day').toDate();

    const corporateTxnId = new Date().valueOf();

    const planNet = packagePrice - discount - Number(subscriptionDiscountPrice || 0);
    const botBuilderNet = (botBuilder || 0) - Number(addOndiscountPrice || 0);
    const shopifyNet = (shopifyIntegration || 0) - Number(shopifyAddOndiscountPrice || 0);
    const [planCoupon, botBuilderCoupon, shopifyCoupon] = splitByShare(couponTotalDiscount, [planNet, botBuilderNet, shopifyNet], true);
    const [planSurcharge, botBuilderSurcharge, shopifySurcharge] = splitByShare(surcharge, [planNet, botBuilderNet, shopifyNet]);

    const baseSub = {
      subscriptionStartDate,
      subscriptionEndDate,
      subscriptionPaymentRefId: corporateTxnId,
      subscriptionPrice: packagePrice,
      subscriptionAmountPaid: Number((planNet + planSurcharge - planCoupon).toFixed(2)),
      corporateUserId,
      packageId,
      credentialId,
      discount: discount + planCoupon,
      billingType,
      billingPlan,
      paymentModeResponse: JSON.stringify({}),
      projectId,
      status: 'ACTIVE',
      vendorSubscriptionId,
    };

    const subscriptionsToCreate = [baseSub];
    if (botBuilder) {
      subscriptionsToCreate.push({
        ...baseSub,
        billingPlan: 'BASIC',
        subscriptionPrice: botBuilder,
        subscriptionAmountPaid: Number((botBuilderNet + botBuilderSurcharge - botBuilderCoupon).toFixed(2)),
        discount: botBuilderCoupon,
        isCustom: true,
        addOnType: 'BOT_BUILDER',
      });
    }
    if (shopifyIntegration) {
      subscriptionsToCreate.push({
        ...baseSub,
        billingPlan: 'BASIC',
        subscriptionPrice: shopifyIntegration,
        subscriptionAmountPaid: Number((shopifyNet + shopifySurcharge - shopifyCoupon).toFixed(2)),
        discount: shopifyCoupon,
        isCustom: true,
        addOnType: 'SHOPIFY_INTEGRATION',
      });
    }

    if (isUpgrade === 'true') {
      // Mark every active WA row for this corporate as UPGRADED — the freshly created row
      // is the replacement. Covers all variants: bundled Basic (isCustom=false,
      // paymentRefId=null), regular Basic (isCustom=false, paymentRefId set), and legacy
      // custom rows (isCustom=true). mainSubId is treated as a hint, not a requirement —
      // if it's missing (e.g., upgrade from a bundled row whose id wasn't propagated
      // through subscription_tags) we still supersede every active row by corporate id.
      if (mainSubId) {
        await WhatsAppSubscription.update(
          { status: 'UPGRADED' },
          { where: { id: mainSubId }, transaction }
        );
      }
      await WhatsAppSubscription.update(
        { status: 'UPGRADED' },
        {
          where: {
            corporateUserId,
            status: 'ACTIVE',
          },
          transaction,
        }
      );
    }

    const created = await WhatsAppSubscription.bulkCreate(subscriptionsToCreate, { returning: true, transaction });

    // Record the purchase in `orders` so it lists in Reports > Subscription Transactions.
    // The mandate webhook previously created the subscription rows but no order row, so
    // mandate-based WhatsApp subs never appeared in the report. Mirrors createWhatsApSubscription.
    const orderDetailsPayload = { ...baseSub, serviceName: packageDetails.packageName };
    delete orderDetailsPayload.paymentModeResponse;
    const orderDetails = await orders.create({
      corporateTxnId,
      operatorId: uuidv4(),
      corporateId: credentialId,
      transactionDate: new Date(),
      amountInINR: pgAmount,
      baseAmount: pgAmount,
      baseCurrency: 'INR',
      exchangeRate: 1,
      status: 'SUCCESS',
      paymentMode: 'PAYMENT GATEWAY',
      paymentModeResponse: JSON.stringify([{ pgAmount }]),
      accountNo: null,
      surcharge,
      serviceOperatorId,
      credentialId,
      subCorporateUserId: null,
      orderResponse: JSON.stringify(orderDetailsPayload),
      message: 'Payment Successful',
      optional: 'WHATSAPP-SUBSCRIPTION',
      ...reportData,
    }, { transaction });

    await transaction.commit();
    // corporateTxnId is minted inside this util — return it (and the order id) so the
    // webhook caller can reference the actual order row (its own txn id differs).
    return { subscription: created[0]?.get({ plain: true }), packageDetails, orderId: orderDetails?.id, corporateTxnId, credentialId };
  } catch (error) {
    if (transaction) await transaction.rollback();
    return { error: true, message: error?.message ?? 'createWhatsAppSubscriptionFromWebhook failed' };
  }
};

exports.updateWhatsAppVendorSubscriptionId = async (id, vendorSubscriptionId) => {
  await WhatsAppSubscription.update({ vendorSubscriptionId }, { where: { id } });
};

// Returns the base (isCustom:false) WhatsApp row to renew for a Cashfree mandate: the ACTIVE row if
// present, else the most-recent EXPIRED row. The EXPIRED fallback lets a lost/late SUCCESS charge
// webhook still create the next cycle after the scheduler expired the base row at endDate+1
// (renewWhatsAppSubscription is status-agnostic and back-dates from the row's subscriptionEndDate).
exports.findWhatsAppSubscriptionByVendorId = async (vendorSubscriptionId) => {
  const active = await WhatsAppSubscription.findOne({
    where: { vendorSubscriptionId, status: 'ACTIVE', isCustom: false },
    raw: true,
    nest: true,
  });
  if (active) return active;
  return WhatsAppSubscription.findOne({
    where: { vendorSubscriptionId, status: 'EXPIRED', isCustom: false },
    order: [['subscriptionEndDate', 'DESC']],
    raw: true,
    nest: true,
  });
};

// Returns a base (isCustom:false) WhatsApp row already stamped with this stable charge payment ref
// (cf_payment_id). Idempotency guard for the CHARGE webhook: on a FAILED-event redelivery this finds
// the cycle a prior SUCCESS already created, so we don't renew twice. Null ref never matches (bundled
// free rows carry a NULL subscriptionPaymentRefId).
exports.findWhatsAppSubscriptionByPaymentRef = async (subscriptionPaymentRefId) => {
  if (!subscriptionPaymentRefId) return null;
  return WhatsAppSubscription.findOne({
    where: { subscriptionPaymentRefId, isCustom: false },
    raw: true,
    nest: true,
  });
};

// Sets isGracePeriod=true on every ACTIVE WhatsApp subscription row matching the vendor mandate
// (main + any active addon under the same mandate). Returns the number of rows touched.
exports.markWhatsAppSubscriptionsGrace = async (vendorSubscriptionId) => {
  const [, affected] = await WhatsAppSubscription.update(
    { isGracePeriod: true },
    { where: { vendorSubscriptionId, status: 'ACTIVE' } }
  );
  return affected;
};

// Marks every ACTIVE WhatsApp subscription row under a Cashfree mandate as CANCELLED — used when the
// mandate is cancelled / paused / expired at the gateway (SUBSCRIPTION_STATUS_CHANGE / PAYMENT_CANCELLED).
// No AiSensy call: our integration has no deactivate-project endpoint, consistent with the grace-expiry
// path which also only updates rows. Returns the number of rows touched.
exports.cancelWhatsAppSubscriptionsByVendor = async (vendorSubscriptionId) => {
  const [affected] = await WhatsAppSubscription.update(
    { status: 'CANCELLED', isCancelled: true, isGracePeriod: false },
    { where: { vendorSubscriptionId, status: 'ACTIVE' } }
  );
  return affected;
};

// Returns active WhatsApp subscription rows for a given Cashfree mandate, joined with user/corp/package
// so the caller can email/notify on charge failure or success.
exports.findActiveWhatsAppSubsWithUserByVendor = async (vendorSubscriptionId) => {
  return WhatsAppSubscription.findAll({
    where: { vendorSubscriptionId, status: 'ACTIVE' },
    include: [
      { model: Package, attributes: ['packageName'] },
      { model: credential, attributes: ['username', 'email'] },
      { model: corporateUser, attributes: ['email', 'name'] },
    ],
    raw: true,
    nest: true,
  });
};

// chargeBreakdown: the split the scheduler stamped on the SUBSCRIPTION_CHARGE order
// ({ listPrice, discountAmount, planAmount, surcharge, addOns: [{ addOnType, price }] }).
// Null for charges triggered before it existed — those keep the legacy split.
exports.renewWhatsAppSubscription = async (existingSubId, corporateTxnId, paymentAmount, serviceOperatorId = null, stablePaymentRefId = null, chargeBreakdown = null, reportData = {}) => {
  let transaction;
  try {
    transaction = await sequelize.transaction();
    const oldSub = await WhatsAppSubscription.findByPk(existingSubId, { raw: true, transaction });
    if (!oldSub) {
      await transaction.rollback();
      return { error: true, message: 'Subscription not found for renewal' };
    }

    // A credential can hold multiple simultaneous add-ons (e.g. Bot Builder + Shopify
    // Integration) — findAll, not findOne, or renewal only carries over one of them and
    // misattributes the other's price onto the base plan's subscriptionAmountPaid.
    let oldAddOns = await WhatsAppSubscription.findAll({
      where: { credentialId: oldSub.credentialId, isCustom: true, status: 'ACTIVE' },
      raw: true,
      transaction,
    });
    // Late-success renewal: the scheduler expired the addons alongside the base at endDate+1,
    // so recover them from the SAME expired cycle (matched on the base's end date). Otherwise
    // they are dropped and their price is mis-attributed to the base plan (the plan's amount paid would
    // be paymentAmount - 0).
    if (!oldAddOns.length) {
      oldAddOns = await WhatsAppSubscription.findAll({
        where: {
          credentialId: oldSub.credentialId,
          isCustom: true,
          status: 'EXPIRED',
          subscriptionEndDate: oldSub.subscriptionEndDate,
        },
        raw: true,
        transaction,
      });
    }

    await WhatsAppSubscription.update({ status: 'EXPIRED' }, { where: { id: existingSubId }, transaction });
    if (oldAddOns.length) {
      await WhatsAppSubscription.update(
        { status: 'EXPIRED' },
        { where: { id: oldAddOns.map((addOn) => addOn.id) }, transaction }
      );
    }

    // Anchor the renewed cycle to the OLD end date, not the charge date. The renewal charge fires up to
    // 2 days BEFORE expiry, so dating from "today" expires the old row early and shortens/drifts each
    // cycle (~1-2 days lost per renewal, billing date creeping earlier). Mirror renewBundledWhatsAppBasic
    // and the Peko successor model: the new cycle starts the day after the old end date, with no gap.
    const oldEnd = moment(oldSub.subscriptionEndDate);
    const subscriptionStartDate = oldEnd.clone().add(1, 'day').startOf('day').toDate();
    const subscriptionEndDate = oldSub.billingType === 'MONTHLY'
      ? oldEnd.clone().add(31, 'days').endOf('day').toDate()
      : oldEnd.clone().add(366, 'days').endOf('day').toDate();

    // With a breakdown, carry forward only the add-ons that were charged (cancelled ones were
    // left out of the charge, so they lapse here) at the price actually charged, and share the
    // platform fee over the plan and add-on rows by price. Legacy rows may have a NULL addOnType (Bot Builder).
    const addOnTypeOf = (addOn) => addOn.addOnType || 'BOT_BUILDER';
    const chargedAddOnPrices = chargeBreakdown
      ? new Map((chargeBreakdown.addOns || []).map((addOn) => [addOnTypeOf(addOn), Number(addOn.price || 0)]))
      : null;
    const addOnsToRenew = chargedAddOnPrices
      ? oldAddOns.filter((addOn) => chargedAddOnPrices.has(addOnTypeOf(addOn)))
      : oldAddOns;
    const addOnPriceOf = (addOn) => (chargedAddOnPrices
      ? chargedAddOnPrices.get(addOnTypeOf(addOn))
      : parseFloat(addOn.subscriptionPrice));
    const surcharge = chargeBreakdown ? Number(chargeBreakdown.surcharge || 0) : 0;

    const totalAddOnPrice = addOnsToRenew.reduce((sum, addOn) => sum + addOnPriceOf(addOn), 0);
    const planNet = paymentAmount - surcharge - totalAddOnPrice;
    const [planSurcharge, ...addOnSurcharges] = splitByShare(surcharge, [planNet, ...addOnsToRenew.map(addOnPriceOf)]);

    const newSubData = {
      subscriptionStartDate,
      subscriptionEndDate,
      subscriptionPaymentRefId: stablePaymentRefId ?? corporateTxnId,
      subscriptionPrice: chargeBreakdown ? chargeBreakdown.listPrice : oldSub.subscriptionPrice,
      subscriptionAmountPaid: Number((planNet + planSurcharge).toFixed(2)),
      corporateUserId: oldSub.corporateUserId,
      packageId: oldSub.packageId,
      credentialId: oldSub.credentialId,
      discount: chargeBreakdown ? chargeBreakdown.discountAmount : oldSub.discount,
      billingType: oldSub.billingType,
      billingPlan: oldSub.billingPlan,
      projectId: oldSub.projectId,
      status: 'ACTIVE',
      vendorSubscriptionId: oldSub.vendorSubscriptionId,
      isCancelled: !!oldSub.isCancelled,
    };

    const subsToCreate = [newSubData, ...addOnsToRenew.map((addOn, i) => ({
      ...newSubData,
      subscriptionPrice: addOnPriceOf(addOn),
      subscriptionAmountPaid: Number((addOnPriceOf(addOn) + addOnSurcharges[i]).toFixed(2)),
      billingPlan: addOn.billingPlan,
      discount: 0,
      isCustom: true,
      addOnType: addOn.addOnType,
    }))];

    const created = await WhatsAppSubscription.bulkCreate(subsToCreate, { returning: true, transaction });

    // Record the renewal in `orders` so it lists in Reports > Subscription Transactions.
    const renewedPackage = await Package.findByPk(oldSub.packageId, { attributes: ['packageName'], raw: true, transaction });
    const orderDetailsPayload = { ...newSubData, serviceName: renewedPackage?.packageName };
    const orderDetails = await orders.create({
      corporateTxnId,
      operatorId: uuidv4(),
      corporateId: oldSub.credentialId,
      transactionDate: new Date(),
      amountInINR: paymentAmount,
      baseAmount: paymentAmount,
      baseCurrency: 'INR',
      exchangeRate: 1,
      status: 'SUCCESS',
      paymentMode: 'PAYMENT GATEWAY',
      paymentModeResponse: JSON.stringify([{ pgAmount: paymentAmount }]),
      accountNo: null,
      surcharge,
      serviceOperatorId,
      credentialId: oldSub.credentialId,
      subCorporateUserId: null,
      orderResponse: JSON.stringify(orderDetailsPayload),
      message: 'Payment Successful',
      optional: 'WHATSAPP-SUBSCRIPTION',
      ...reportData,
    }, { transaction });

    await transaction.commit();
    return { subscription: created[0], orderId: orderDetails?.id, credentialId: oldSub.credentialId };
  } catch (error) {
    if (transaction) await transaction.rollback();
    return { error: true, message: error?.message ?? 'renewWhatsAppSubscription failed' };
  }
};

// ─── Peko+ bundle ─────────────────────────────────────────────────────────────
// Identification trio for "free WhatsApp basic bundled with Peko+":
//   subscriptionPaymentRefId IS NULL  AND  billingPlan = 'BASIC'  AND  isCustom = false
// (no schema change needed — these three together don't collide with paid or pro rows).

exports.PENDING_PROJECT_ID = PENDING_PROJECT_ID;

const findBundledWhatsAppRow = async (corporateUserId, options = {}) => {
  const { transaction, includeCancelled = false } = options;
  const where = {
    corporateUserId,
    status: 'ACTIVE',
    subscriptionPaymentRefId: null,
    billingPlan: 'BASIC',
    isCustom: false,
  };
  if (!includeCancelled) where.isCancelled = false;
  return WhatsAppSubscription.findOne({ where, raw: true, transaction });
};
exports.findBundledWhatsAppRow = findBundledWhatsAppRow;

/**
 * Bundle a free WhatsApp BASIC subscription with a Peko+ purchase.
 * - Idempotent: if the corporate already has ANY active WA row, skip.
 * - Defers AiSensy project creation — stores `projectId = 'PENDING'`; the frontend
 *   calls `POST /whatsapp/initialize-bundled-project` on first WhatsApp page visit
 *   to create the project and update this row.
 * - All dates / vendorSubscriptionId match the Peko+ row so the bundle moves through
 *   AUTH/CHARGE/expiry alongside it.
 */
exports.bundleWhatsAppBasicForPekoPlus = async ({
  traceId = null,
  corporateUserId,
  credentialId,
  partnerId,
  subscriptionStartDate,
  subscriptionEndDate,
  billingType,
  corporateTxnId,
  vendorSubscriptionId,
  transaction,
}) => {
  // Existence check — paid Pro, free basic, anything ACTIVE blocks bundling.
  const existing = await WhatsAppSubscription.findOne({
    where: { corporateUserId, status: 'ACTIVE', isCancelled: false },
    raw: true,
    transaction,
  });
  if (existing) {
    customLog(traceId, 'info', {
      message: 'Skipping Peko+ WhatsApp bundle — user already has an active WhatsApp subscription',
      corporateUserId,
      existingId: existing.id,
      existingPlan: existing.billingPlan,
    });
    return null;
  }

  // Find the basic WhatsApp package (lowest priorityLevel among accessCode='whatsapp').
  const pkgWhere = { status: true, accessCode: 'whatsapp' };
  if (partnerId !== undefined && partnerId !== null && partnerId !== '') {
    pkgWhere.partnerId = partnerId;
  }
  const basicPkg = await Package.findOne({
    where: pkgWhere,
    order: [['priorityLevel', 'ASC']],
    raw: true,
    transaction,
  });
  if (!basicPkg) {
    customLog(traceId, 'error', {
      message: 'Peko+ bundle: no basic WhatsApp package found',
      partnerId,
    });
    return null;
  }

  const row = await WhatsAppSubscription.create(
    {
      corporateUserId,
      credentialId,
      packageId: basicPkg.id,
      subscriptionStartDate,
      subscriptionEndDate,
      subscriptionPaymentRefId: null,   // ← bundle marker
      subscriptionPrice: 0,
      subscriptionAmountPaid: 0,
      discount: 0,
      status: 'ACTIVE',
      billingType,
      billingPlan: 'BASIC',             // ← bundle marker
      projectId: PENDING_PROJECT_ID,    // deferred — frontend triggers AiSensy createProject on first visit
      isCancelled: false,
      isCustom: false,                  // ← bundle marker
      vendorSubscriptionId,             // shares Peko+'s Cashfree mandate so CHARGE webhook can find both
      corporateTxnId,
    },
    { transaction },
  );

  customLog(traceId, 'info', {
    message: 'Peko+ WhatsApp bundle created',
    whatsAppSubscriptionId: row.id,
    corporateUserId,
    packageId: basicPkg.id,
    subscriptionEndDate,
  });
  return row;
};

/**
 * On Peko+ CHARGE renewal, roll the bundled WhatsApp basic row forward to match the
 * new Peko+ cycle. Old row → EXPIRED, fresh ACTIVE row inserted from oldEndDate + 1.
 */
exports.renewBundledWhatsAppBasic = async ({
  traceId = null,
  corporateUserId,
  oldEndDate,
  billingType,
  corporateTxnId,
  vendorSubscriptionId,
  transaction,
}) => {
  const bundled = await findBundledWhatsAppRow(corporateUserId, { transaction });
  if (!bundled) return null;

  await WhatsAppSubscription.update(
    { status: 'EXPIRED' },
    { where: { id: bundled.id }, transaction },
  );

  const baseEnd = oldEndDate ? moment(oldEndDate) : moment(bundled.subscriptionEndDate);
  const newStart = baseEnd.clone().add(1, 'day').startOf('day').toDate();
  const newEnd = billingType === 'ANNUALLY'
    ? baseEnd.clone().add(366, 'days').endOf('day').toDate()
    : baseEnd.clone().add(31, 'days').endOf('day').toDate();

  const renewed = await WhatsAppSubscription.create(
    {
      corporateUserId,
      credentialId: bundled.credentialId,
      packageId: bundled.packageId,
      subscriptionStartDate: newStart,
      subscriptionEndDate: newEnd,
      subscriptionPaymentRefId: null,
      subscriptionPrice: 0,
      subscriptionAmountPaid: 0,
      discount: 0,
      status: 'ACTIVE',
      billingType,
      billingPlan: 'BASIC',
      projectId: bundled.projectId,   // carry the real AiSensy projectId across renewal (or 'PENDING')
      isCancelled: false,
      isCustom: false,
      vendorSubscriptionId,
      corporateTxnId,
    },
    { transaction },
  );

  customLog(traceId, 'info', {
    message: 'Peko+ WhatsApp bundle renewed',
    oldId: bundled.id,
    newId: renewed.id,
    corporateUserId,
    newSubscriptionEndDate: newEnd,
  });
  return renewed;
};

/**
 * Create the AiSensy project for a bundled WhatsApp row whose `projectId` is still
 * the PENDING sentinel. Called by the WhatsApp module landing-page init endpoint
 * on the user's first visit. Idempotent — if the row already has a real projectId,
 * returns it; if no bundled row exists for the corporate, returns null without
 * creating anything (caller should treat null as "not eligible / nothing to init").
 */
exports.initializeBundledWhatsAppProject = async ({ corporateUserId, credentialId, username, traceId = null }) => {
  customLog(traceId, 'info', {
    message: '[WA-BUNDLE] initializeBundledWhatsAppProject: entry',
    corporateUserId,
    credentialId,
    username,
  });
  // Lazy-require to avoid the heavy services import at module load time.
  const {
    fetchVendorDetailsByServiceDetails,
    createProjectApi,
  } = require('../services/whatsAppForBusiness');
  const { fetchWhatsAppBusinessByCredentialId } = require('../models/use-cases/whatsappforBusiness');

  // Log ALL rows for this corporate (no filter) before applying the trio.
  const allRows = await WhatsAppSubscription.findAll({
    where: { corporateUserId },
    attributes: ['id', 'projectId', 'status', 'billingPlan', 'isCustom', 'isCancelled', 'subscriptionPaymentRefId', 'subscriptionPrice', 'packageId', 'billingType', 'subscriptionStartDate', 'subscriptionEndDate', 'createdAt'],
    raw: true,
  });
  customLog(traceId, 'info', {
    message: '[WA-BUNDLE] initializeBundledWhatsAppProject: ALL rows for corporate',
    corporateUserId,
    rowCount: allRows.length,
    rows: allRows,
  });

  const bundled = await findBundledWhatsAppRow(corporateUserId);
  customLog(traceId, 'info', {
    message: '[WA-BUNDLE] initializeBundledWhatsAppProject: findBundledWhatsAppRow result',
    corporateUserId,
    bundled,
    matched: !!bundled,
  });
  if (!bundled) return null;
  if (bundled.projectId && bundled.projectId !== PENDING_PROJECT_ID) {
    // Already initialized — nothing to do.
    customLog(traceId, 'info', {
      message: '[WA-BUNDLE] initializeBundledWhatsAppProject: already initialized — short-circuit',
      whatsAppSubscriptionId: bundled.id,
      projectId: bundled.projectId,
    });
    return { projectId: bundled.projectId, alreadyInitialized: true };
  }

  const waVendor = await fetchVendorDetailsByServiceDetails(
    { id: credentialId, packageId: bundled.packageId, corporateId: corporateUserId },
    'whatsApp_for_busines',
  );
  customLog(traceId, 'info', {
    message: '[WA-BUNDLE] initializeBundledWhatsAppProject: fetched vendor',
    waVendorPresent: !!waVendor,
    waVendor,
  });

  const waBusinessResult = await fetchWhatsAppBusinessByCredentialId(credentialId);
  customLog(traceId, 'info', {
    message: '[WA-BUNDLE] initializeBundledWhatsAppProject: fetchWhatsAppBusinessByCredentialId result',
    credentialId,
    waBusinessResult,
  });
  if (!waBusinessResult?.status || !waBusinessResult?.businessId) {
    customLog(traceId, 'error', {
      message: '[WA-BUNDLE] initializeBundledWhatsAppProject: AiSensy business not provisioned for credential',
      credentialId,
      corporateUserId,
    });
    return { error: true, message: 'AiSensy business not provisioned' };
  }

  const mockReq = {
    body: {
      // Matches the format the existing createProjectApi expects (see services/whatsAppForBusiness.js).
      subscriptionPlan: 'whatsapp basic',
      subscriptionDuration: bundled.billingType === 'ANNUALLY' ? 'ANNUAL' : 'MONTHLY',
    },
    user: { id: credentialId, username },
  };
  customLog(traceId, 'info', {
    message: '[WA-BUNDLE] initializeBundledWhatsAppProject: calling createProjectApi',
    businessId: waBusinessResult.businessId,
    mockReqBody: mockReq.body,
    mockReqUser: mockReq.user,
  });
  const projectResult = await createProjectApi(waVendor, waBusinessResult.businessId, mockReq);
  customLog(traceId, 'info', {
    message: '[WA-BUNDLE] initializeBundledWhatsAppProject: createProjectApi returned',
    projectResult,
  });
  if (!projectResult?.status || !projectResult?.data?.id) {
    customLog(traceId, 'error', {
      message: '[WA-BUNDLE] initializeBundledWhatsAppProject: createProjectApi did not return a project id',
      credentialId,
      corporateUserId,
      result: projectResult,
    });
    return { error: true, message: 'Failed to create AiSensy project' };
  }

  const realProjectId = String(projectResult.data.id);
  await WhatsAppSubscription.update(
    { projectId: realProjectId },
    { where: { id: bundled.id } },
  );
  customLog(traceId, 'info', {
    message: '[WA-BUNDLE] initializeBundledWhatsAppProject: bundled row updated with real projectId',
    whatsAppSubscriptionId: bundled.id,
    corporateUserId,
    projectId: realProjectId,
  });
  return { projectId: realProjectId, whatsAppSubscriptionId: bundled.id };
};
