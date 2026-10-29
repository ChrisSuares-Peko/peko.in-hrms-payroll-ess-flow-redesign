const moment = require('moment');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

const sequelize = require('./../configs/database/index');
const Package = require('../models/entities/package');
const ServiceSubscription = require('../models/entities/serviceSubscription');
const orders = require('../models/entities/order');
const UserCoupons = require('../models/entities/userCoupons');
const { findOneCoupon } = require('../models/use-cases/pekoCredits');
const { calculateDiscountResponse } = require('./calculateDiscount');
const { customLog } = require('./loggerHelper');
const operatorsData = require('./operatorsData.json');

// Peko POS grant. Unlike Peko Commerce this is a ONE-TIME purchase: no Cashfree
// mandate is created, so `vendorSubscriptionId` is deliberately left NULL and the
// renewal scheduler never auto-debits the row. `subscriptionPaymentRefId` is
// always stamped so the expiry sweep can reap the row at subscriptionEndDate —
// without it an INDIVIDUAL row stays ACTIVE forever.

const POS_ACCESS_CODE = operatorsData['pekoPos']['accessKey'];

function formatSubscription(subscriptionPlan, duration) {
    try {
        return {
            formattedPlan: String(subscriptionPlan).toUpperCase(),
            formattedDuration: String(duration).toUpperCase(),
        };
    } catch (error) {
        return { formattedPlan: '', formattedDuration: '' };
    }
}

const resolvePlanPricing = (packagePrices, discount, billingType) => {
    const isAnnual = billingType === 'ANNUALLY';
    const price = parseFloat((isAnnual ? packagePrices?.annually : packagePrices?.monthly) || 0) || 0;
    const flatDiscount = parseFloat((isAnnual ? discount?.annually : discount?.monthly) || 0) || 0;
    return { price, discount: flatDiscount };
};

const resolvePgResponse = paymentGatewayResponse =>
    Array.isArray(paymentGatewayResponse)
        ? paymentGatewayResponse.find(p => p?.payment_status === 'SUCCESS') || paymentGatewayResponse[0]
        : paymentGatewayResponse;

// Everything the payment handler must know before it writes anything: the
// package (with its vendor plan id), whether this corporateTxnId was already
// granted, and whether the same plan+cycle is already active.
exports.findPosPurchaseContext = async ({ credentialId, packageId, subscriptionDuration, corporateTxnId }) => {
    const { formattedDuration: billingType } = formatSubscription('', subscriptionDuration);
    const posPackage = { model: Package, where: { accessCode: POS_ACCESS_CODE }, required: true };

    const packageDetails = packageId
        ? await Package.findOne({
              where: { id: packageId, accessCode: POS_ACCESS_CODE },
              attributes: ['id', 'packageName', 'packagePrices', 'discount', 'packageType', 'externalId'],
              raw: true,
              nest: true,
          })
        : null;

    const alreadyProcessed = corporateTxnId
        ? await ServiceSubscription.findOne({
              include: [posPackage],
              where: { subscriptionPaymentRefId: String(corporateTxnId) },
              raw: true,
              nest: true,
          })
        : null;

    const existingSubscription = packageId
        ? await ServiceSubscription.findOne({
              include: [posPackage],
              where: { credentialId, packageId, status: 'ACTIVE', billingType: { [Op.eq]: billingType } },
              raw: true,
              nest: true,
          })
        : null;

    return { billingType, packageDetails, alreadyProcessed, existingSubscription };
};

exports.createPosSubscription = async data => {
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
            partnerId,
        } = data;

        const pgResponse = resolvePgResponse(paymentGatewayResponse);
        const { formattedPlan: billingPlan, formattedDuration: billingType } = formatSubscription(
            subscriptionPlan,
            subscriptionDuration
        );
        const amount = pgAmount;

        const isExistingSubscription = await ServiceSubscription.findOne({
            include: [{ model: Package, where: { accessCode: POS_ACCESS_CODE }, required: true }],
            where: {
                credentialId,
                packageId,
                status: 'ACTIVE',
                billingType: { [Op.eq]: billingType },
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
            include: [{ model: Package, where: { accessCode: POS_ACCESS_CODE }, required: true }],
            where: { credentialId, status: 'ACTIVE' },
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
            attributes: ['id', 'packageName', 'packagePrices', 'discount', 'packageType', 'externalId'],
            raw: true,
            nest: true,
        });

        if (!packageDetails) {
            await transaction.rollback();
            return { error: true, message: 'Invalid package details' };
        }

        const { price: packagePrice, discount: totalDiscount } = resolvePlanPricing(
            packageDetails.packagePrices,
            packageDetails.discount,
            billingType
        );

        const subscriptionStartDate = moment().startOf('day').toDate();
        const subscriptionEndDate =
            billingType === 'ANNUALLY'
                ? moment().add(1, 'year').endOf('day').toDate()
                : moment().add(29, 'days').endOf('day').toDate();

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
                    { where: { id: userCouponData.id }, transaction }
                );
            }
        }

        const subscription = await ServiceSubscription.create(newSubscription, { transaction });

        const orderDetailsPayload = {
            ...newSubscription,
            serviceName: `Peko POS - ${packageDetails.packageName}`,
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
                paymentModeResponse: JSON.stringify([{ ...pgResponse, pgAmount: parseFloat(amount) }]),
                accountNo: null,
                surcharge: 0,
                serviceOperatorId,
                credentialId,
                subCorporateUserId: null,
                orderResponse: JSON.stringify(orderDetailsPayload),
                message: 'Payment Successful',
                optional: 'POS-SUBSCRIPTION',
                ...reportData,
            },
            { transaction }
        );

        await transaction.commit();

        return { subscription, packageDetails, orderId: orderDetails?.id };
    } catch (error) {
        customLog(null, 'error', { message: 'Peko POS subscription error', error: error?.message });
        if (transaction) await transaction.rollback();
        return { error: true, message: 'something went wrong' };
    }
};

// Merge-write onto serviceSubscriptions.vendorResponse so a later write never
// clobbers what an earlier one stored.
exports.markPosProvision = async (subscriptionId, patch) => {
    if (!subscriptionId) return;
    try {
        const row = await ServiceSubscription.findOne({
            where: { id: subscriptionId },
            attributes: ['id', 'vendorResponse'],
            raw: true,
        });
        const previous =
            row?.vendorResponse && typeof row.vendorResponse === 'object' ? row.vendorResponse : {};
        await ServiceSubscription.update(
            { vendorResponse: { ...previous, ...patch } },
            { where: { id: subscriptionId } }
        );
    } catch (error) {
        customLog(null, 'error', {
            message: 'Peko POS provision state write failed',
            subscriptionId,
            error: error?.message,
        });
    }
};
