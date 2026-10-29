const asyncHandler = require("../../middlewares/async");
let sequelizeConfig = require('../../configs/database/index');
const Subscription = require("../entities/subscription");
const { handleSortFields } = require("../../utils/sortHandle");
const { formattedDateTime, formatNumberWithLocalString } = require("../../utils/formatter");
const Package = require("../entities/package");
const { Op } = require("sequelize");

exports.findAndCountAllSubscriptions = asyncHandler(async (params) => {
    try {
        let {
            limit,
            offset,
            status,
            packageType,
            searchText,
            from,
            to,
            corporateId,
            sortField,
            sort,
            registeredBy
        } = params;

        limit = Number.isFinite(limit) ? limit : 10;
        offset = Number.isFinite(offset) ? offset : 0;

        let whereConditions = "1=1";
        let replacements = { limit, offset };

        whereConditions += " AND subscriptionPaymentRefId IS NOT NULL";

        if (from && to) {
            whereConditions += " AND subscriptionStartDate BETWEEN :from AND :to";
            replacements.from = `${from} 00:00:00`;
            replacements.to = `${to} 23:59:59`;
        }

        if (status) {
            whereConditions += " AND status = :status";
            replacements.status = status;
        }

        if (corporateId) {
            whereConditions += " AND credentialId = :corporateId";
            replacements.corporateId = corporateId;
        }

        if (registeredBy) {
            whereConditions += " AND registeredBy = :registeredBy";
            replacements.registeredBy = registeredBy;
        }

        if (packageType) {
            whereConditions += " AND packageType = :packageType";
            replacements.packageType = packageType;
        }

        if (searchText) {
            whereConditions += ` AND (
          corporateUsername LIKE :searchText OR 
          corporateName LIKE :searchText OR 
          packageName LIKE :searchText OR 
          packageType LIKE :searchText OR 
          subscriptionPaymentRefId LIKE :searchText OR 
          billingType LIKE :searchText
        )`;
            replacements.searchText = `%${searchText}%`;
        }

        const orderClause = handleSortFields(sortField, sort);

        const orderSql = orderClause
            .map(([field, direction]) => `${field} ${direction}`)
            .join(", ");

        const totalCountQuery = `
        SELECT COUNT(*) AS totalCount
        FROM corporateSubscriptions
        WHERE ${whereConditions}
      `;

        const dataQuery = `
        SELECT *
        FROM corporateSubscriptions
        WHERE ${whereConditions}
        ORDER BY ${orderSql}
        LIMIT :limit OFFSET :offset
      `;

        const [result, totalCountResult] = await Promise.all([
            sequelizeConfig.query(dataQuery, {
                replacements,
                type: sequelizeConfig.QueryTypes.SELECT,
                nest: true,
                raw: true
            }),
            sequelizeConfig.query(totalCountQuery, {
                replacements,
                type: sequelizeConfig.QueryTypes.SELECT
            })
        ]);

        return {
            rows: result,
            count: totalCountResult[0].totalCount
        };

    } catch (error) {
        console.error("Error finding subscription details:", error);
        return false;
    }
});
  

exports.subscriptionsExcelCSVData = asyncHandler(async (params) => {
    try {
        const {
            status,
            packageType,
            searchText,
            from,
            to,
            corporateId,
            sortField,
            sort,
            registeredBy,
        } = params;

        let whereConditions = "1=1";
        let replacements = {};

        whereConditions += " AND subscriptionPaymentRefId IS NOT NULL";

        if (from && to) {
            whereConditions += " AND subscriptionStartDate BETWEEN :from AND :to";
            replacements.from = `${from} 00:00:00`;
            replacements.to = `${to} 23:59:59`;
        }

        if (status) {
            whereConditions += " AND status = :status";
            replacements.status = status;
        }

        if (corporateId) {
            whereConditions += " AND credentialId = :corporateId";
            replacements.corporateId = corporateId;
        }

        if (registeredBy) {
            whereConditions += " AND registeredBy = :registeredBy";
            replacements.registeredBy = registeredBy;
        }

        if (packageType) {
            whereConditions += " AND packageType = :packageType";
            replacements.packageType = packageType;
        }

        if (searchText) {
            whereConditions += ` AND (
          corporateUsername LIKE :searchText OR 
          corporateName LIKE :searchText OR 
          packageName LIKE :searchText OR 
          packageType LIKE :searchText OR 
          subscriptionPaymentRefId LIKE :searchText OR
          billingType LIKE :searchText
        )`;
            replacements.searchText = `%${searchText}%`;
        }

        const orderClause = handleSortFields(sortField, sort);

        const dataQuery = `
        SELECT *
        FROM corporateSubscriptions
        WHERE ${whereConditions}
        ORDER BY ${orderClause
                .map(([field, direction]) => `${field} ${direction}`)
                .join(", ")}
      `;

        const result = await sequelizeConfig.query(dataQuery, {
            replacements,
            type: sequelizeConfig.QueryTypes.SELECT,
            nest: true,
            raw: true,
        });

        let finalData = result.map((limitData) => ({
            "Transaction Date": limitData.createdAt
                ? formattedDateTime(limitData.createdAt)
                : "Not Available",
            "Transaction ID": limitData.subscriptionPaymentRefId ?? "Not Available",
            "Corporate ID": limitData.corporateUsername ?? "Not Available",
            "Corporate Name": limitData.corporateName ?? "Not Available",
            "Partner Name": limitData.registeredByUsername ?? "Not Available",
            Package: limitData.packageName ?? "Not Available",
            "Start Date": limitData.subscriptionStartDate
                ? formattedDateTime(limitData.subscriptionStartDate)
                : "Not Available",
            "End Date": limitData.subscriptionEndDate
                ? formattedDateTime(limitData.subscriptionEndDate)
                : "Not Available",
            "Actual Price": limitData.subscriptionPrice
                ? "₹ " + formatNumberWithLocalString(limitData.subscriptionPrice)
                : "0.00",
            Discount: limitData.discount
                ? "₹ " + formatNumberWithLocalString(limitData.discount)
                : "0.00",
            "Payment Mode": limitData.paymentMode ?? "Not Available",
            "Paid Amount": limitData.subscriptionAmountPaid
                ? "₹ " + formatNumberWithLocalString(limitData.subscriptionAmountPaid)
                : "0.00",
            "Voucher Code": limitData.voucherCode ?? "Not Available",
            "Coupon used": limitData.couponCode ?? "Not Available",
            Status: limitData.status ?? "Not Available",
        }));

        return finalData;
    } catch (error) {
        console.error("Error exporting subscriptions:", error);
        return false;
    }
});


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

exports.findActiveIndividualBaseForService = asyncHandler(async (params) => {
    const { corporateUserId, serviceOperatorId } = params
    return Subscription.findOne({
        include: [
            {
                model: Package,
                attributes: [],
                where: {
                    packageType: 'INDIVIDUAL'
                },
                required: true
            }
        ],
        where: {
            corporateUserId: corporateUserId,
            serviceOperatorId: serviceOperatorId,
            status: 'ACTIVE',
            isCustom: false
        },
        attributes: ['packageId'],
        order: [['subscriptionEndDate', 'DESC'], ['id', 'DESC']],
        raw: true,
        nest: true
    })
})

exports.checkUserSubscriptionPriority = asyncHandler(async (corporateUserId,partnerId) => {
    try {
        const activeGroupSubscription = await Subscription.findOne({
            include: [
                {
                    model: Package,
                    attributes: ['id', 'packageName', 'priorityLevel'],
                    where: {
                        packageType: 'GROUP'
                    },
                }
            ],
            where: {
                status: 'ACTIVE',
                corporateUserId: corporateUserId,
                subscriptionPaymentRefId: {
                    [Op.ne]: null
                }
            },
            attributes: ['id'],
            raw: true,
            nest: true
        })

        if (!activeGroupSubscription) {
            return false; // No active subscription found
        }

        // Find the package with the highest priority level
        const topPlanPriority = await Package.max('priorityLevel', {
            where: { status: true, packageType: 'GROUP', partnerId: partnerId }
        });

        // Check if the user's package has the top priority level
        const isTopPriority = activeGroupSubscription.package.priorityLevel == topPlanPriority;

        return isTopPriority
    } catch (error) {
        return false
    }
})

exports.getActiveGroupSubscriptionDetails = asyncHandler(async (corporateUserId, partnerId) => {
    try {
        const activeGroupSubscription = await Subscription.findOne({
            include: [
                {
                    model: Package,
                    attributes: ['id', 'packageName', 'priorityLevel'],
                    where: {
                        packageType: 'GROUP'
                    },
                }
            ],
            where: {
                status: 'ACTIVE',
                corporateUserId: corporateUserId,
                subscriptionPaymentRefId: {
                    [Op.ne]: null
                }
            },
            attributes: ['id'],
            raw: true,
            nest: true
        })

        if (!activeGroupSubscription) {
            return { activeGroupPackageName: null, isTopPlan: false }
        }

        // Find the package with the highest priority level
        const topPlanPriority = await Package.max('priorityLevel', {
            where: { status: true, packageType: 'GROUP', partnerId: partnerId }
        })

        return {
            activeGroupPackageName: activeGroupSubscription.package.packageName,
            isTopPlan: activeGroupSubscription.package.priorityLevel == topPlanPriority
        }
    } catch (error) {
        return { activeGroupPackageName: null, isTopPlan: false }
    }
})

exports.findActiveSubscriptionsByPackage = asyncHandler(async (params, attributes=null) => {
    const { packageId } = params
    try {
        const allActiveSubscriptions = await Subscription.findAll({
            where: {
                packageId: packageId,
                status: 'ACTIVE'
            },
            attributes: attributes,
            raw: true,
            nest: true
        })

        return allActiveSubscriptions

    } catch (error) {
        console.error('Error finding package details:', error);
        return false
    }
})