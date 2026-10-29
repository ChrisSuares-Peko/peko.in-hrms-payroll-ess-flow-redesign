const sequelize = require('./../configs/database/index');
const Package = require("../models/entities/package");
const { Op } = require('sequelize');
const ServiceSubscription = require('../models/entities/serviceSubscription');
const moment = require('moment');
const { computeUpgradeCredit } = require('./upgradeCredit');
const orders = require('../models/entities/order');
const { v4: uuidv4 } = require('uuid');
const { findOneCoupon } = require('../models/use-cases/pekoCredits');
const { calculateDiscountResponse } = require('./calculateDiscount');
const UserCoupons = require('../models/entities/userCoupons');
const {
  fireSubscriptionCreated,
  fireSubscriptionUpgraded,
  fireSubscriptionRenewed,
} = require('./pekoEcomEvents');
const { customLog } = require('./loggerHelper');
const { fetchServiceDetails } = require('./checkAndFetchServiceDetails');
const { findOneCorporate } = require('../models/use-cases/corporateUser');
const { findOne: findPackage } = require('../models/use-cases/package');
const { findActiveByAccessCode } = require('../models/use-cases/serviceSubscription');
const { computeJournalData } = require('./computeJournalData');
const { journalBillingType } = require('./billingCycle');
const { publishJournalEvent } = require('./bull/queue/accountingEventsQueue');
const operatorsData = require('./operatorsData.json');
const ECOMMERCE_STORE_ACCESS_KEY = operatorsData['ecommerceStore']['accessKey'];

function formatSubscription(subscriptionPlan, duration) {
  try {
    const formattedDuration = duration.toUpperCase();
    const formattedPlan = subscriptionPlan.toUpperCase();
    return { formattedPlan, formattedDuration };
  } catch (error) {
    return { status: false, message: error?.message, plan: '' };
  }
}

const resolvePlanPricing = (packagePrices, discount, billingType) => {
  const isAnnual = String(billingType || '').toUpperCase() === 'ANNUALLY';
  const price = parseFloat((isAnnual ? packagePrices?.annually : packagePrices?.monthly) || 0) || 0;
  const flatDiscount = parseFloat((isAnnual ? discount?.annually : discount?.monthly) || 0) || 0;
  return { price, discount: flatDiscount };
};
exports.resolvePlanPricing = resolvePlanPricing;

const resolvePgResponse = (paymentGatewayResponse) =>
  Array.isArray(paymentGatewayResponse)
    ? paymentGatewayResponse.find((p) => p?.payment_status === 'SUCCESS') || paymentGatewayResponse[0]
    : paymentGatewayResponse;

exports.createEcommerceStoreSubscription = async (data) => {
  let transaction;
  try {
    transaction = await sequelize.transaction();

    const {
      packageId,
      pgAmount,
      corporateId,
      credentialId,
      serviceOperatorId,
      corporateTxnId,
      subscriptionPlan,
      subscriptionDuration,
      paymentGatewayResponse,
      reportData,
      couponCode,
      couponTotalDiscount = 0,
      partnerId,
    } = data;

    const pgResponse = resolvePgResponse(paymentGatewayResponse);
    const formattedSubscription = formatSubscription(subscriptionPlan, subscriptionDuration);
    const amount = pgAmount;
    const billingPlan = formattedSubscription.formattedPlan;
    const billingType = formattedSubscription.formattedDuration;

    const isExistingSubscription = await ServiceSubscription.findOne({
      include: [{ model: Package }],
      where: {
        packageId: packageId,
        credentialId: credentialId,
        status: 'ACTIVE',
        billingType: {
          [Op.eq]: billingType,
        },
      },
      raw: true,
      nest: true,
    });

    if (isExistingSubscription) {
      await transaction.rollback();
      return {
        error: true,
        message: `User already has the ${isExistingSubscription.package.packageName} subscription plan.`,
      };
    }

    const previousActiveSubscription = await ServiceSubscription.findOne({
      include: [
        {
          model: Package,
          where: { accessCode: 'ecommerce_store' },
          required: true,
        },
      ],
      where: {
        credentialId,
        status: 'ACTIVE',
      },
      transaction,
    });

    if (previousActiveSubscription) {
      await ServiceSubscription.update(
        { status: 'UPGRADED', subscriptionEndDate: new Date() },
        { where: { id: previousActiveSubscription.id }, transaction }
      );
    }

    const packageDetails = await Package.findOne({
      where: { id: packageId },
      attributes: ['id', 'packageName', 'packagePrices', 'discount', 'packageType'],
      raw: true,
      nest: true,
    });

    if (!packageDetails) {
      await transaction.rollback();
      return {
        error: true,
        message: 'Invalid package details',
      };
    }

    const { price, discount: discountPrice } = resolvePlanPricing(
      packageDetails.packagePrices,
      packageDetails.discount,
      billingType
    );
    const packagePrice = price;

    const subscriptionStartDate = moment().startOf('day').toDate();
    const subscriptionEndDate =
      billingType === 'ANNUALLY'
        ? moment().add(1, 'year').endOf('day').toDate()
        : moment().add(29, 'days').endOf('day').toDate();

    const totalDiscount = discountPrice + Number(couponTotalDiscount);
    let currentSubscription;

    const newSubscription = {
      subscriptionStartDate,
      subscriptionEndDate,
      subscriptionPaymentRefId: corporateTxnId,
      subscriptionPrice: packagePrice,
      subscriptionAmountPaid: amount,
      corporateUserId: corporateId,
      status: 'ACTIVE',
      packageId,
      credentialId,
      discount: totalDiscount,
      billingType,
      billingPlan,
      paymentModeResponse: JSON.stringify([pgResponse]),
      projectId: uuidv4(),
      vendorResponse: null,
      vendorSubscriptionId: data.vendorSubscriptionId || undefined,
    };

    if (couponCode) {
      const { data: userCouponData } = await findOneCoupon({
        couponCode,
        corporateUserId: corporateId,
        packageId,
        partnerId,
      });
      if (userCouponData?.id) {
        const couponDiscount = calculateDiscountResponse(
          userCouponData.couponData,
          parseFloat(pgAmount)
        ).data?.discountAmount;

        await UserCoupons.update(
          {
            status: 'CLAIMED',
            claimedAt: new Date(),
            usedCouponData: { ...userCouponData.couponData, discountAmount: couponDiscount },
          },
          {
            where: { id: userCouponData.id },
            transaction,
          }
        );
      }
    }

    const subscription = await ServiceSubscription.create(newSubscription, { transaction });

    const orderDetailsPayload = {
      ...newSubscription,
      serviceName: `Peko Commerce - ${packageDetails.packageName}`,
    };
    delete orderDetailsPayload.paymentModeResponse;

    const orderDetails = await orders.create(
      {
        corporateTxnId,
        operatorId: uuidv4(),
        corporateId: credentialId,
        transactionDate: new Date(),
        amountInINR: parseFloat(amount),
        baseAmount: parseFloat(amount),
        baseCurrency: 'INR',
        exchangeRate: 1,
        status: 'SUCCESS',
        paymentMode: 'PAYMENT GATEWAY',
        paymentModeResponse: JSON.stringify([
          { ...pgResponse, pgAmount: parseFloat(amount) },
        ]),
        accountNo: null,
        surcharge: 0,
        serviceOperatorId,
        credentialId,
        subCorporateUserId: null,
        orderResponse: JSON.stringify(orderDetailsPayload),
        message: 'Payment Successful',
        optional: 'ECOMMERCE-SUBSCRIPTION',
        ...reportData,
      },
      {
        transaction,
      }
    );

    await transaction.commit();

    const eventSub = {
      sub: {
        id: subscription?.id,
        projectId: newSubscription.projectId,
        credentialId,
        billingType,
        subscriptionStartDate,
        subscriptionEndDate,
      },
      packageId,
      amount: pgAmount,
    };
    if (previousActiveSubscription) {
      if (previousActiveSubscription.projectId) {
        void fireSubscriptionUpgraded({
          ...eventSub,
          previousPekoSubscriptionId: String(previousActiveSubscription.projectId),
        });
      } else {
        customLog(null, 'error', {
          message:
            '[pekoEcom] subscription.upgraded aborted — previous subscription has no projectId (chain subscription id)',
          data: {
            previousSubscriptionRowId: previousActiveSubscription.id,
            credentialId,
          },
        });
      }
    } else {
      void fireSubscriptionCreated(eventSub);
    }

    return { subscription, packageDetails, currentSubscription, orderId: orderDetails?.id };
  } catch (error) {
    customLog(null, 'error', { message: 'eCommerce subscription error', error: error?.message });
    if (transaction) await transaction.rollback();
    return {
      error: true,
      message: 'something went wrong',
    };
  }
};

// Commission lives on the specific package (Starter/Growth/Advanced), not the shared
// ecommerce_store service operator — same shape as WhatsApp's getWaCommissionFields
// in cashFreeGateway.js. planCommissions carries a per-duration override.
const getPackageCommissionFields = (pkg, duration) => {
  const override = duration && pkg?.planCommissions?.[duration.toLowerCase()];
  return {
    ...(override || {
      commissionMode: pkg?.commissionMode,
      commissionType: pkg?.commissionType,
      commission: pkg?.commission,
      fixedCommissionPerTransaction: pkg?.fixedCommissionPerTransaction,
      isCommissionInclGST: pkg?.isCommissionInclGST,
    }),
    isCommissionConfigured: pkg?.isCommissionConfigured,
  };
};

// Same accounting-report shape the one-time `payment` controller builds: Peko's own
// subscription, booked on its billing cycle with no vendor payable or commission.
const buildEcommerceStoreReportData = async ({ credentialId, corporateId, packageId, billingType, pgAmount, paymentMethod, partnerDetails, couponTotalDiscount = 0, creditAmount = 0 }) => {
  const serviceDetails = await fetchServiceDetails({
    credentialId,
    accessKey: ECOMMERCE_STORE_ACCESS_KEY,
    packageId,
    corporateUserId: corporateId,
  });
  if (!serviceDetails || serviceDetails.error) return { serviceDetails: null, reportData: {} };

  const [corporate, purchasedPackage] = await Promise.all([
    findOneCorporate({ id: corporateId }),
    findPackage({ id: packageId }),
  ]);
  const durationKey = (billingType || "").toLowerCase();
  const commFields = getPackageCommissionFields(purchasedPackage, durationKey);
  const { price: listPrice, discount: planDiscount } = resolvePlanPricing(
    purchasedPackage?.packagePrices,
    purchasedPackage?.discount,
    billingType
  );
  const planDiscountTaken = listPrice ? Math.min(planDiscount, listPrice) : 0;
  const payablePlanAmount = listPrice ? listPrice - planDiscountTaken : Number(pgAmount);
  const planAmount = Math.max(0, payablePlanAmount - Number(creditAmount));
  const planDetails = [{
    name: purchasedPackage?.packageName ? `Service Package : ${purchasedPackage.packageName}` : "Service Package",
    commissionMode: commFields.commissionMode,
    commissionType: commFields.commissionType,
    commission: commFields.commission,
    fixedCommissionPerTransaction: commFields.fixedCommissionPerTransaction,
    isCommissionInclGST: commFields.isCommissionInclGST,
    isCommissionConfigured: commFields.isCommissionConfigured,
    amount: planAmount,
  }];

  const reportData = await computeJournalData({
    serviceDetails,
    pgAmount,
    amount: planAmount + planDiscountTaken,
    paymentMethod: paymentMethod ? { name: paymentMethod, code: paymentMethod } : {},
    partnerDetails,
    paymentGatewayName: 'Cashfree',
    couponTotalDiscount: couponTotalDiscount + planDiscountTaken,
    planDetails,
    corporateState: corporate?.state || '',
    billingType: journalBillingType(billingType),
    isSubscription: true,
  });

  return { serviceDetails, reportData };
};

// Mandate AUTH succeeded — create the first subscription cycle.
exports.createEcommerceStoreSubscriptionFromWebhook = async ({
  subscriptionTags,
  packageDetails,
  vendorSubscriptionId,
  serviceOperatorId,
  paymentGatewayResponse,
  partnerDetails,
}) => {
  const { credentialId, corporateId, packageId, billingType, couponCode, couponTotalDiscount, partnerId, pgAmount } = subscriptionTags;
  const paymentMethod = paymentGatewayResponse?.data?.payment_method;

  const previousActiveSubscription = await findActiveByAccessCode(credentialId, ECOMMERCE_STORE_ACCESS_KEY);
  const creditAmount = computeUpgradeCredit(previousActiveSubscription);

  const { serviceDetails, reportData } = await buildEcommerceStoreReportData({
    credentialId,
    corporateId,
    packageId,
    billingType,
    pgAmount,
    paymentMethod,
    partnerDetails,
    couponTotalDiscount,
    creditAmount,
  });

  const totalAmount = Number(pgAmount) || 0;

  // Published as soon as reportData is valid — Cashfree already collected this AUTH
  // charge by the time this runs, independent of whether creating the subscription
  // row below succeeds.
  const corporateTxnId = new Date().valueOf();
  if (reportData?.journalData) {
    publishJournalEvent(
      {
        transactionRef: corporateTxnId,
        type: 'payment',
        contextSnapshot: {
          credentialId,
          vendor: serviceDetails?.vendor || null,
          registeredBy: partnerId || null,
        },
        reportData,
      }
    );
  }

  const result = await exports.createEcommerceStoreSubscription({
    packageId,
    pgAmount: totalAmount,
    corporateId,
    credentialId,
    serviceOperatorId,
    corporateTxnId,
    subscriptionPlan: packageDetails?.packageName,
    subscriptionDuration: billingType,
    paymentGatewayResponse,
    reportData,
    couponCode: couponCode || undefined,
    couponTotalDiscount,
    partnerId,
    vendorSubscriptionId,
  });

  return result;
};

// Mandate CHARGE succeeded — renewal, row-chained (old row EXPIRED, new row ACTIVE).
exports.renewEcommerceStoreSubscription = async ({ vendorSubscriptionId, chargedAmount, listPrice, discountAmount, paymentGatewayResponse, partnerDetails, partnerId }) => {
  let transaction;
  try {
    const currentSubscription = await ServiceSubscription.findOne({
      where: { vendorSubscriptionId: String(vendorSubscriptionId), status: 'ACTIVE' },
      include: [{ model: Package }],
      raw: true,
      nest: true,
    });
    if (!currentSubscription) {
      return { error: true, message: 'No ACTIVE Peko Commerce subscription found for this mandate' };
    }

    const packageDetails = currentSubscription.package;
    const { billingType, credentialId, corporateUserId: corporateId, packageId } = currentSubscription;

    const { serviceDetails, reportData } = await buildEcommerceStoreReportData({
      credentialId,
      corporateId,
      packageId,
      billingType,
      pgAmount: chargedAmount,
      paymentMethod: paymentGatewayResponse?.data?.payment_method,
      partnerDetails,
    });

    // Generated here (not alongside the row below) and published immediately — Cashfree
    // already collected this CHARGE by the time we got here, independent of whether the
    // renewal write below succeeds.
    const corporateTxnId = new Date().valueOf();
    if (reportData?.journalData) {
      publishJournalEvent(
        {
          transactionRef: corporateTxnId,
          type: 'payment',
          contextSnapshot: {
            credentialId,
            vendor: serviceDetails?.vendor || null,
            registeredBy: partnerId || null,
          },
          reportData,
        }
      );
    }

    transaction = await sequelize.transaction();

    await ServiceSubscription.update(
      { status: 'EXPIRED' },
      { where: { id: currentSubscription.id }, transaction }
    );

    const subscriptionStartDate = moment().startOf('day').toDate();
    const subscriptionEndDate =
      billingType === 'ANNUALLY'
        ? moment().add(1, 'year').endOf('day').toDate()
        : moment().add(29, 'days').endOf('day').toDate();
    const pgResponse = resolvePgResponse(paymentGatewayResponse);

    const renewedSubscription = {
      subscriptionStartDate,
      subscriptionEndDate,
      subscriptionPaymentRefId: corporateTxnId,
      subscriptionPrice: listPrice != null ? listPrice : currentSubscription.subscriptionPrice,
      subscriptionAmountPaid: chargedAmount,
      corporateUserId: corporateId,
      status: 'ACTIVE',
      packageId,
      credentialId,
      discount: discountAmount != null ? discountAmount : currentSubscription.discount,
      billingType,
      billingPlan: currentSubscription.billingPlan,
      paymentModeResponse: JSON.stringify([pgResponse]),
      projectId: currentSubscription.projectId,
      vendorResponse: null,
      vendorSubscriptionId: String(vendorSubscriptionId),
    };
    const subscription = await ServiceSubscription.create(renewedSubscription, { transaction });

    const orderDetailsPayload = { ...renewedSubscription, serviceName: `Peko Commerce - ${packageDetails.packageName}` };
    delete orderDetailsPayload.paymentModeResponse;

    const orderDetails = await orders.create(
      {
        corporateTxnId,
        operatorId: uuidv4(),
        corporateId: credentialId,
        transactionDate: new Date(),
        amountInINR: parseFloat(chargedAmount),
        baseAmount: parseFloat(chargedAmount),
        baseCurrency: 'INR',
        exchangeRate: 1,
        status: 'SUCCESS',
        paymentMode: 'PAYMENT GATEWAY',
        paymentModeResponse: JSON.stringify([{ ...pgResponse, pgAmount: parseFloat(chargedAmount) }]),
        accountNo: null,
        surcharge: 0,
        credentialId,
        subCorporateUserId: null,
        orderResponse: JSON.stringify(orderDetailsPayload),
        message: 'Renewal Successful',
        optional: 'ECOMMERCE-SUBSCRIPTION',
        ...reportData,
      },
      { transaction }
    );

    await transaction.commit();

    void fireSubscriptionRenewed({
      sub: {
        id: subscription?.id,
        projectId: renewedSubscription.projectId,
        credentialId,
        billingType,
        subscriptionStartDate,
        subscriptionEndDate,
      },
      packageId,
      amount: chargedAmount,
    });

    return {
      subscription,
      packageDetails,
      orderId: orderDetails?.id,
      credentialId,
      corporateId,
      billingType,
    };
  } catch (error) {
    customLog(null, 'error', { message: 'eCommerce subscription renewal error', error: error?.message });
    if (transaction) await transaction.rollback();
    return { error: true, message: 'something went wrong' };
  }
};
