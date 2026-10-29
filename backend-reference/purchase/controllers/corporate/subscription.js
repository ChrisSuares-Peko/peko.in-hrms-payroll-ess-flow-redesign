const asyncHandler = require("../../middlewares/async");
const { Op } = require("sequelize");
const { createSubscriptionUsingCode, checkSubscriptionIsExist, findExistingGroupPackage, findIndividualPackageIsAlreadyActive } = require("../../models/use-cases/subscription");
const { findOne } = require("../../models/use-cases/subscriptionVoucher");
const { findOne: findOneCorporate } = require("../../models/use-cases/corporateUser");
const { createNotification } = require("../../models/use-cases/notification");
const Subscription = require("../../models/entities/subscription");
const Package = require("../../models/entities/package");
const ErrorResponse = require("../../utils/error-response");
const { customLog } = require("../../utils/loggerHelper");


exports.checkActivationCode = asyncHandler(async (req, res, next) => {
    try {
        const activationCode = req.body.activationCode;
        const pkgId = req.body.packageId;
        let billing = req.body.billingType;
        const corporateId = req.user.corporateId;
        const partnerId = req.user.registeredBy
        const activationCodeData = await findOne(
            {
                whereClause: { activationCode: activationCode, isUsed: false, status: true },
                attributes: ['billingType', 'packageId'],
                partnerId,
                packageId: pkgId
            }
        );

        if (!activationCodeData) {
            return res.status(400).json({
                status: false,
                message: "The activation code is invalid or expired.",
                responseCode: "001",
                data: {},
            })
        }

        if (activationCodeData.billingType === 'MONTHLY' && activationCodeData.billingType != billing.toUpperCase()) {
            return next(new ErrorResponse(`This voucher code can be applied only for monthly subscription plan.`, 501));
        }
        if (activationCodeData.billingType === 'ANNUALLY' && activationCodeData.billingType != billing.toUpperCase()) {
            return next(new ErrorResponse(`This voucher code can be applied only for yearly subscription plan.`, 501));
        }

        const { packageId, billingType, package } = activationCodeData

        const isExistingSubscription = await checkSubscriptionIsExist({ packageId, corporateId, billingType })
        if (isExistingSubscription) {
            return next(new ErrorResponse('You are trying to activate a subscription that you already have.', 409))
        }

        if (package.packageType == 'INDIVIDUAL') {
            // check whether the individual subscription is already active for that user   
            // case if user is already have premium and he try to activate payroll subscription . but payroll is already included in premium    
            const currentSubscription = await findExistingGroupPackage(corporateId)
            if (currentSubscription) {
                const currentPackageId = currentSubscription?.package?.id
                const isAlreadyExist = await findIndividualPackageIsAlreadyActive({ packageId, currentPackageId })
                if (isAlreadyExist) {
                    return next(new ErrorResponse('You are trying to activate a subscription that you already have.', 409))
                }
            }
        }
        return res.status(200).json({
            status: true,
            message: "Subscription activation code verified successfully",
            responseCode: "000",
            data: { activationCode: activationCodeData },
        })
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
        return next(new ErrorResponse(`The activation code is invalid or expired.`, 500))
    }
})

exports.activateSubscription = asyncHandler(async (req, res, next) => {
    try {
        const corporateId = req.user.corporateId
        const activationCode = req.body.activationCode;
        let billing = req.body.billingType;
        const pkgId = req.body.packageId;
        const partnerId = req.user.registeredBy

        const activationCodeData = await findOne(
            {
                whereClause: { activationCode: activationCode, isUsed: false, status: true, billingType: billing.toUpperCase() },
                attributes: undefined,
                partnerId,
                packageId: pkgId
            }
        );

        if (!activationCodeData) {
            return res.status(400).json({
                status: false,
                message: "The activation code is invalid or expired.",
                responseCode: "001",
                data: {}
            })
        }

        const { id: couponId, packageId, billingType, package } = activationCodeData
        const isExistingSubscription = await checkSubscriptionIsExist({ packageId, corporateId, billingType })
        if (isExistingSubscription) {
            return next(new ErrorResponse('You are trying to activate a subscription that you already have.', 409))
        }

        if (package.packageType == 'INDIVIDUAL') {
            const currentSubscription = await findExistingGroupPackage(corporateId)
            if (currentSubscription) {
                const currentPackageId = currentSubscription?.package?.id
                const isAlreadyExist = await findIndividualPackageIsAlreadyActive({ packageId, currentPackageId })
                if (isAlreadyExist) {
                    return next(new ErrorResponse('You are trying to activate a subscription that you already have.', 409))
                }
            }
        }

        const data = {
            package: {
                ...package,
                packageId: packageId
            },
            couponId: couponId,
            corporateId: corporateId,
            billingType: billingType
        }

        const subscription = await createSubscriptionUsingCode(data)

        if (!subscription) {
            return res.status(400).json({
                status: false,
                message: "Something went wrong while activating your subscription plan.",
                responseCode: "001",
                data: {}
            })
        }

        const corporateDetails = await findOneCorporate({ corporateId:req.user.id }, ["email", "name"], ["username"]);

        const username = corporateDetails?.credential?.username;

        const existingSubscription = await Subscription.findOne({
            where: {
                packageId: packageId,
                corporateUserId: corporateId,
                status: 'ACTIVE',
                billingType: {
                    [Op.ne]: billingType
                }
            },
            include: [{
                model: Package,
                attributes: ['packageName']
            }],
            raw: true,
            nest: true
        });

        let notificationData;
        if (package.packageType === "INDIVIDUAL") {
            notificationData = {
                notificationTitle: "Subscription Activated",
                notificationBrief: `We are pleased to inform you that your ${package.packageName} subscription has been successfully activated. Your service is now active.`,
                notificationTo: username ? [username] : [],
                notificationCategory: "CORPORATE",
                notificationBy: "ADMIN",
                accessKey: null,
                action: "2",
            };
        } else {
            if (existingSubscription && existingSubscription.package?.packageName === package.packageName) {
                // Same package, different billing period (upgrade scenario)
                const oldBillingType = existingSubscription.billingType;
                const oldPeriod = oldBillingType === "MONTHLY" ? "Monthly" : oldBillingType === "ANNUALLY" ? "Yearly" : "";
                const newPeriod = billingType === "MONTHLY" ? "Monthly" : billingType === "ANNUALLY" ? "Yearly" : "";

                if (oldPeriod && newPeriod && oldBillingType !== billingType) {
                    notificationData = {
                        notificationTitle: "Subscription Upgraded",
                        notificationBrief: `Thank you for upgrading your ${package.packageName} plan from ${oldPeriod} to ${newPeriod}. Your subscription has been successfully activated, and your new plan features are now active.`,
                        notificationTo: username ? [username] : [],
                        notificationCategory: "CORPORATE",
                        notificationBy: "ADMIN",
                        accessKey: null,
                        action: "2",
                    };
                } else {
                    notificationData = {
                        notificationTitle: "Subscription Activated",
                        notificationBrief: `Thank you for activating your ${package.packageName} plan. Your subscription has been successfully activated, and your plan features are now active.`,
                        notificationTo: username ? [username] : [],
                        notificationCategory: "CORPORATE",
                        notificationBy: "ADMIN",
                        accessKey: null,
                        action: "2",
                    };
                }
            } else if (existingSubscription) {
                // Different package upgrade
                notificationData = {
                    notificationTitle: "Subscription Upgraded",
                    notificationBrief: `Thank you for upgrading your plan from ${existingSubscription.package?.packageName} to ${package.packageName}. Your subscription has been successfully activated, and your new plan features are now active.`,
                    notificationTo: username ? [username] : [],
                    notificationCategory: "CORPORATE",
                    notificationBy: "ADMIN",
                    accessKey: null,
                    action: "2",
                };
            } else {
                // New subscription
                notificationData = {
                    notificationTitle: "Subscription Activated",
                    notificationBrief: `We are pleased to inform you that your ${package.packageName} subscription has been successfully activated. Your service is now active.`,
                    notificationTo: username ? [username] : [],
                    notificationCategory: "CORPORATE",
                    notificationBy: "ADMIN",
                    accessKey: null,
                    action: "2",
                };
            }
        }

        if (username) {
            await createNotification(notificationData);
        } else {
            customLog(req?.LogTraceId, "error", { message: "Cannot send notification: username not found", corporateId });
        }

        const { subscriptionStartDate, subscriptionEndDate, billingType: subscriptionType } = subscription
        return res.status(200).json({
            status: true,
            message: "Your subscription package has been successfully activated.",
            responseCode: "000",
            data: {
                subscription: {
                    packageName: package.packageName,
                    subscriptionStartDate: subscriptionStartDate,
                    subscriptionEndDate: subscriptionEndDate,
                    billingType: subscriptionType
                }
            },
        })
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
        return next(new ErrorResponse(`Something went wrong while activating your subscription plan.`, 500))
    }
})