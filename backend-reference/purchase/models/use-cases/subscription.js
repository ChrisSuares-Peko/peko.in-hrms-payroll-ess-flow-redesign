
const { Op } = require("sequelize");
const moment = require('moment');
const Sequelize = require('../../configs/database/index');
const asyncHandler = require("../../middlewares/async");
const Subscription = require("../entities/subscription");
const CorporateUser = require("../entities/corporateUser");
const Cashback = require("../entities/cashback");
const Package = require("../entities/package");
const SubscriptionVouchers = require("../entities/subscriptionVoucher");

exports.findAllActiveSubscriptions = asyncHandler(async (params) => {
    const { corporateUserId } = params
    try {
        const allActiveSubscriptions = await Subscription.findAll({
            where: {
                corporateUserId: corporateUserId,
                status: 'ACTIVE'
            },
            raw: true,
            nest: true
        })

        return allActiveSubscriptions

    } catch (error) {
        console.error('Error finding package details:', error);
        return false
    }
})

exports.findExistingGroupPackage = asyncHandler(async (corporateUserId) => {
    const activeGroupSubscription = await Subscription.findOne({
        include: [
            {
                model: Package,
                attributes: ['id', 'packageName'],
                where: {
                    packageType: 'GROUP'
                },
            }
        ],
        where: {
            status: 'ACTIVE',
            corporateUserId: corporateUserId
        },
        attributes: ['id'],
        raw: true,
        nest: true
    })

    return activeGroupSubscription
})

const findExistingGroupPackage = exports.findExistingGroupPackage;

exports.findIndividualPackageIsAlreadyActive = asyncHandler(async (params) => {
    const { packageId, currentPackageId } = params

    try {
        const servicesUnderAPackage = await Cashback.findAll({
            attributes: ['serviceOperatorId', 'packageId'],
            where: {
                serviceStatus: true,
                packageId: currentPackageId,
            },
            raw: true,
            nest: true
        });
        const servicesId = servicesUnderAPackage.map((cashback) => cashback.serviceOperatorId)

        const IndividualPackages = await Cashback.findAll({
            include: [
                {
                    model: Package,
                    where: {
                        status: true,
                        packageType: 'INDIVIDUAL'
                    },
                    attributes: ['id', 'packageName']
                }
            ],
            attributes: ['serviceOperatorId', 'packageId'],
            where: {
                serviceStatus: true,
                serviceOperatorId: {
                    [Op.in]: servicesId
                },
            },
            raw: true,
            nest: true
        });

        const IndividualPackageIds = IndividualPackages.map((cashback) => cashback.packageId)

        return IndividualPackageIds.includes(packageId);
    } catch (error) {
        return true
    }
})

exports.findAllActiveIndividualSubscriptions = asyncHandler(async (params) => {
    const { corporateId, packageId, currentPackageId } = params
    try {
        const servicesUnderAPackage = await Cashback.findAll({
            attributes: ['serviceOperatorId', 'packageId'],
            where: {
                serviceStatus: true,
                packageId: packageId,
            },
            raw: true,
            nest: true
        });
        const servicesId = servicesUnderAPackage.map((cashback) => cashback.serviceOperatorId)

        const IndividualPackages = await Cashback.findAll({
            include: [
                {
                    model: Package,
                    where: {
                        status: true,
                        packageType: 'INDIVIDUAL'
                    },
                    attributes: ['id', 'packageName']
                }
            ],
            attributes: ['serviceOperatorId', 'packageId'],
            where: {
                serviceStatus: true,
                serviceOperatorId: {
                    [Op.in]: servicesId
                },
            },
            raw: true,
            nest: true
        });
        const IndividualPackageIds = IndividualPackages.map((cashback) => cashback.packageId)

        if (currentPackageId && packageId != currentPackageId) {
            IndividualPackageIds.push(Number(currentPackageId));
        }

        const allActiveIndividualSubscriptions = await Subscription.findAll({
            where: {
                corporateUserId: corporateId,
                packageId: {
                    [Op.in]: IndividualPackageIds
                },
                status: 'ACTIVE',
                subscriptionPaymentRefId: {
                    [Op.ne]: null
                }
            },
            raw: true,
            nest: true
        })

        return allActiveIndividualSubscriptions

    } catch (error) {
        console.error('Error finding package details:', error);
        return false
    }
})

const findAllActiveIndividualSubscriptions = exports.findAllActiveIndividualSubscriptions;

exports.checkSubscriptionIsExist = asyncHandler(async (subscriptionData) => {
    const { packageId, corporateId, billingType } = subscriptionData
    try {
        const isExist = await Subscription.findOne({
            where: {
                packageId: packageId,
                corporateUserId: corporateId,
                status: 'ACTIVE',
                billingType: {
                    [Op.eq]: billingType
                }
            },
            raw: true,
            nest: true
        });
        return isExist;
    } catch (error) {
        throw { error };
    }
});

exports.createSubscriptionUsingCode = asyncHandler(async (data) => {
    let transaction;
    const { package, couponId, billingType, corporateId } = data
    const { packagePrices, discount, packageId, packageType } = package
    try {
        transaction = await Sequelize.transaction();

        // check user is trying to activate a group subscription. 
        // if it is group package check is there any individual subscriptions is already active under this group. 
        // if it is active change status into upgraded
        if (packageType === "GROUP") {
            // fetch current group subscription rather than basic
            const currentSubscription = await findExistingGroupPackage(corporateId)
            if (currentSubscription) {

                const currentPackageId = currentSubscription?.package?.id

                const allActiveSubscriptions = await findAllActiveIndividualSubscriptions({ corporateId, packageId, currentPackageId })

                const subscriptionIds = allActiveSubscriptions.map(subscription => subscription.id);

                // if user is already have an individual subscriptions perform the update operation for all active subscriptions under the package.
                if (subscriptionIds.length > 0) {
                    await Subscription.update(
                        { status: 'UPGRADED' },
                        {
                            where: {
                                id: subscriptionIds
                            },
                            transaction
                        }
                    );
                }

                if (currentSubscription) {
                    await Subscription.update(
                        { status: 'UPGRADED' },
                        {
                            where: {
                                packageId: currentPackageId,
                                corporateUserId: corporateId
                            },
                            transaction
                        }
                    );
                }
                // update package id in the  corporate user table
                await CorporateUser.update(
                    { packageId: packageId },
                    {
                        where: {
                            id: corporateId
                        },
                        transaction
                    }
                );
            }
        }
        const subscriptionStartDate = moment().startOf('day').toDate();
        const corporateTxnId = new Date().valueOf()
        let subscriptionEndDate;
        let discountPrice = 0
        let packagePrice = 0

        if (billingType === "MONTHLY") {
            packagePrice = packagePrices.monthly
            discountPrice = discount.monthly
            subscriptionEndDate = moment().add(29, 'days').endOf('day').toDate();
        } else if (billingType === "ANNUALLY") {
            packagePrice = packagePrices.annually
            discountPrice = discount.annually
            subscriptionEndDate = moment().add(364, 'days').endOf('day').toDate();
        } else {
            throw { error: 'Invalid billing type' };
        }

        const newSubscription = {
            subscriptionStartDate: subscriptionStartDate,
            subscriptionEndDate: subscriptionEndDate,
            subscriptionPaymentRefId: corporateTxnId,
            subscriptionPrice: packagePrice,
            subscriptionAmountPaid: 0,
            taxableAmount: 0,
            taxAmount: 0,
            taxRate: 0,
            corporateUserId: corporateId,
            packageId: packageId,
            discount: discountPrice,
            billingType: billingType,
            paymentModeResponse: null,
            paymentMode: 'ACTIVATION_CODE'
        }
        // Create the new subscription with the transaction
        const subscription = await Subscription.create(newSubscription, { transaction });
console.log(subscription,"Updated")
        // Update the subscription code to mark it as used
        await SubscriptionVouchers.update(
            { isUsed: true, subscriptionPaymentRefId: corporateTxnId },
            { where: { id: couponId }, transaction }
        );

        // Commit the transaction
        await transaction.commit();
        return subscription;
    } catch (error) {
        if (transaction) await transaction.rollback();
        throw error; 
    }
});

exports.findOne = asyncHandler(async (params) => {
    return await Subscription.findOne({
        where: params,
    });
});

exports.findAllSubscription = asyncHandler(async (params) => {
    try {
        const allActiveSubscriptions = await Subscription.findAll({
            where: params,
            raw: true,
            nest: true
        })

        return allActiveSubscriptions

    } catch (error) {
        console.error('Error finding subscription details:', error);
        return false
    }
})