const asyncHandler = require('./../../middlewares/async')

const ServiceSubscription = require('../entities/serviceSubscription');
const Package = require('../entities/package');
const { Op } = require('sequelize');
const { customLog } = require('../../utils/loggerHelper');

exports.findActiveByAccessCode = asyncHandler(async (credentialId, accessCode, attributes = undefined) => {
    try {
        return await ServiceSubscription.findOne({
            where: { credentialId, status: "ACTIVE" },
            include: [
                {
                    model: Package,
                    attributes: ['packageName', 'accessCode', 'packagePrices', 'discount'],
                    where: { accessCode },
                    required: true,
                }
            ],
            attributes,
            raw: true,
            nest: true,
        })
    } catch (error) {
        customLog(null, 'error', { error: error.message });
    } finally {
        customLog(null, "info", { message: `SERVICE SUBSCRIPTION FIND ACTIVE BY ACCESS CODE CALLED` });
    }
})

exports.findLastExpiredByAccessCode = asyncHandler(async (credentialId, accessCode, attributes = undefined) => {
    try {
        return await ServiceSubscription.findOne({
            where: { credentialId, status: "EXPIRED" },
            include: [
                {
                    model: Package,
                    attributes: ['packageName', 'accessCode'],
                    where: { accessCode },
                    required: true,
                }
            ],
            order: [['subscriptionEndDate', 'DESC']],
            attributes,
            raw: true,
            nest: true,
        })
    } catch (error) {
        customLog(null, 'error', { error: error.message });
    } finally {
        customLog(null, "info", { message: `SERVICE SUBSCRIPTION FIND LAST EXPIRED BY ACCESS CODE CALLED` });
    }
})

exports.findLastTerminatedByAccessCode = asyncHandler(async (credentialId, accessCode, attributes = undefined) => {
    try {
        return await ServiceSubscription.findOne({
            where: { credentialId, status: { [Op.in]: ["EXPIRED", "CANCELLED"] } },
            include: [
                {
                    model: Package,
                    attributes: ['packageName', 'accessCode'],
                    where: { accessCode },
                    required: true,
                }
            ],
            order: [['subscriptionEndDate', 'DESC']],
            attributes,
            raw: true,
            nest: true,
        })
    } catch (error) {
        customLog(null, 'error', { error: error.message });
    } finally {
        customLog(null, "info", { message: `SERVICE SUBSCRIPTION FIND LAST TERMINATED BY ACCESS CODE CALLED` });
    }
})

exports.findOne = asyncHandler(async (params, attributes=undefined) => {
    try {
        return await ServiceSubscription.findOne({
            where: params,
            include:[
                {
                    model: Package,
                    attributes: ['packageName', 'accessCode']
                }
            ],
            attributes,
            raw: true,
            nest:true,
        })
    } catch (error) {
        console.log(error)
    } finally {
        console.log("SERVICE SUBSCRIPTION FIND ONE ROUTE CALLED")
    }
})

exports.findAndCountUserPlans = asyncHandler(async (params) => {

    try {
        const { corporateId, limit, offset, status, packageType } = params;

        let whereConditions = {
            corporateUserId: corporateId,
        };

        if (status) {
            whereConditions.status = status;
        }

        let packageWhereConditions = {}
        if (packageType) {
            packageWhereConditions.packageType = packageType;
        }

        const allActiveSubscriptions = await ServiceSubscription.findAndCountAll({
            include: [
                {
                    model: Package,
                    attributes: ['id', 'packageName', 'packageType', 'description', 'serviceList', 'packageLogo'],
                    where: packageWhereConditions,
                }
            ],
            where: whereConditions,
            attributes: ['id', 'subscriptionStartDate', 'subscriptionEndDate', 'subscriptionAmountPaid', 'status', 'billingType','createdAt'],
            limit: limit,
            offset: offset,
            order: [['createdAt', 'DESC']],
            raw: true,
            nest: true
        })

        return allActiveSubscriptions

    } catch (error) {
        console.error('Error finding package details:', error);
        return false
    }
})

exports.cancelUserServiceSubscription = asyncHandler(async (params) => {
    try {
        const { subscriptionId, corporateId } = params;
        // Update the subscription status to 'CANCELLED'
        await ServiceSubscription.update(
            { isCancelled: true },
            {
                where: {
                    id: subscriptionId,
                    corporateUserId: corporateId
                }
            }
        );
        return { success: true, message: "Subscription cancelled successfully." };
    } catch (error) {
        console.error('Error while canceling the subscription:', error);
        return { success: false, message: "Something went wrong." };
    }
});