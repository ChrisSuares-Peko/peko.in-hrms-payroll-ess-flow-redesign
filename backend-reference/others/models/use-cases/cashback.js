/* eslint-disable no-undef */
const cashback = require('./../entities/cashback')
const { Op } = require("sequelize");
const asyncHandler = require('./../../middlewares/async');
const sequelizeConfig = require('../../configs/database/index')
const sequelize = require('sequelize')
const { formattedDateTime, formatNumberWithLocalString } = require('../../utils/formatter');
const { SURCHARGE, reviewedChange } = require('../../utils/configuredFlag');
exports.create = asyncHandler(async (params) => {
    return await cashback.create(params)
})
exports.update = asyncHandler(async (params, data) => {
    const reviewed = await reviewedChange({
        load: () => cashback.findOne({ where: { id: params.id }, attributes: SURCHARGE.fields, raw: true }),
        incoming: data,
        group: SURCHARGE,
        table: 'cashbacks',
        id: params.id,
    })
    return await cashback.update(reviewed, {
        where: {
            id: params.id
        }
    })
})
exports.updateConfigured = asyncHandler(async (params, data) => {
    return await cashback.update({ ...data, isSurchargeConfigured: true }, {
        where: {
            id: params.id
        }
    })
})
exports.createConfigured = asyncHandler(async (params) => {
    return await cashback.create({ ...params, isSurchargeConfigured: true })
})
exports.findByPackageAndOperator = asyncHandler(async ({ packageId, serviceOperatorId }) => {
    return await cashback.findOne({
        where: { packageId, serviceOperatorId },
        attributes: ['id'],
        raw: true,
    })
})
// Bulk-configure — one UPDATE across every selected row's cashback/surcharge fields.
exports.bulkUpdate = asyncHandler(async (ids, data) => {
    return await cashback.update({ ...data, isSurchargeConfigured: true }, {
        where: {
            id: { [Op.in]: ids }
        }
    })
})

const SURCHARGE_REQUIRED_FIELDS = ['surchargeType', 'surcharge'];

const hasAllSurchargeFields = row =>
    SURCHARGE_REQUIRED_FIELDS.every(field => row[field] !== null && row[field] !== undefined);

// A manual override for rows whose surcharge was genuinely set before this flag existed —
// turning it on is blocked unless the surcharge fields are actually there to back it up.
exports.setSurchargeConfigured = asyncHandler(async (id, value) => {
    if (!value) {
        await cashback.update({ isSurchargeConfigured: false }, { where: { id } });
        return { ok: true };
    }

    const row = await cashback.findOne({ where: { id }, attributes: SURCHARGE_REQUIRED_FIELDS, raw: true });
    if (!row || !hasAllSurchargeFields(row)) {
        return { ok: false, reason: 'MISSING_FIELDS' };
    }

    await cashback.update({ isSurchargeConfigured: true }, { where: { id } });
    return { ok: true };
})
exports.findOne = asyncHandler(async (params) => {
    try {
        let { serviceOperatorId, packageIds } = params
        return await cashback.findOne({
            where: {
                packageId: {
                    [Op.in]: packageIds
                },
                serviceOperatorId,
                serviceStatus: true,
            },
            order: [['packageId', 'ASC'], ['id', 'ASC']],
            raw: true
        })
    } catch (error) {
        console.log(error)
    } finally {
        console.log("CASHBACK FIND ONE ROUTE CALLED")
    }
})
exports.deleteCashback = asyncHandler(async (params) => {
    return await cashback.destroy({
        where: {
            id: params.id
        }
    })
})

exports.findAllPackageCashbackCount = asyncHandler(async (params) => {
    try {
        let { limit, offset, searchText, sort, sortField, partnerId, serviceOperatorId } = params;

        const safeLimit = parseInt(limit, 10) || 10;
        const safeOffset = parseInt(offset, 10) || 0;

        let whereClause = `
        WHERE
          (
            cashbacks.cashbackType LIKE :searchText
            OR cashbacks.cashback LIKE :searchText
            OR serviceOperators.serviceProvider LIKE :searchText
            OR packages.packageName LIKE :searchText
            OR vendors.vendorName LIKE :searchText
          )
      `;

        if (partnerId === "default") {
            whereClause += ` AND packages.partnerId IS NULL`;
        } else if (partnerId) {
            whereClause += ` AND packages.partnerId = :partnerId`;
        }

        if (serviceOperatorId) {
            whereClause += ` AND cashbacks.serviceOperatorId = :serviceOperatorId`;
        }

        const query = `
        SELECT 
          cashbacks.*, 
          serviceOperators.serviceProvider,
          serviceOperators.serviceCategory,
          packages.packageName,
          packages.partnerId,
          credentials.name AS partnerName,
          vendors.vendorName 
        FROM cashbacks
        LEFT JOIN serviceOperators 
          ON cashbacks.serviceOperatorId = serviceOperators.id
        LEFT JOIN vendors 
          ON serviceOperators.vendorId = vendors.id
        LEFT JOIN packages 
          ON cashbacks.packageId = packages.id
        LEFT JOIN credentials 
          ON packages.partnerId = credentials.id
        ${whereClause}
        ORDER BY ${sortField} ${sort}
        LIMIT :limit
        OFFSET :offset;
      `;

        const replacements = {
            searchText: `%${searchText || ""}%`,
            limit: safeLimit,
            offset: safeOffset,
        };

        if (partnerId && partnerId !== "default") {
            replacements.partnerId = partnerId;
        }

        if (serviceOperatorId) {
            replacements.serviceOperatorId = serviceOperatorId;
        }

        const data = await sequelizeConfig.query(query, {
            replacements,
            type: sequelize.QueryTypes.SELECT,
            raw: true,
            nest: true,
        });

        const countQuery = `
        SELECT COUNT(*) AS totalCount
        FROM cashbacks
        LEFT JOIN serviceOperators 
          ON cashbacks.serviceOperatorId = serviceOperators.id
        LEFT JOIN vendors 
          ON serviceOperators.vendorId = vendors.id
        LEFT JOIN packages 
          ON cashbacks.packageId = packages.id
        LEFT JOIN credentials 
          ON packages.partnerId = credentials.id
        ${whereClause}
      `;

        const countReplacements = {
            searchText: `%${searchText || ""}%`,
        };

        if (partnerId && partnerId !== "default") {
            countReplacements.partnerId = partnerId;
        }

        if (serviceOperatorId) {
            countReplacements.serviceOperatorId = serviceOperatorId;
        }

        const totalCountResult = await sequelizeConfig.query(countQuery, {
            replacements: countReplacements,
            type: sequelize.QueryTypes.SELECT,
        });

        return {
            rows: data.map((item) => ({
                ...item,
                serviceOperator: {
                    serviceProvider: item.serviceProvider,
                },
                package: {
                    packageName: item.packageName,
                },
                vendor: {
                    vendorName: item.vendorName,
                },
            })),
            count: totalCountResult[0].totalCount,
        };
    } catch (error) {
        console.log(error);
        throw { message: 'Something went wrong' };
    }
})

exports.packageCashbackAndCountExport = asyncHandler(async (params) => {
    try {
        let { searchText, sort, sortField, partnerId } = params;

        let whereClause = `
        WHERE 
          (cashbacks.cashbackType LIKE :searchText
          OR cashbacks.cashback LIKE :searchText
          OR serviceOperators.serviceProvider LIKE :searchText
          OR packages.packageName LIKE :searchText
          OR vendors.vendorName LIKE :searchText)
      `;

        const replacements = {
            searchText: `%${searchText || ""}%`,
        };

        if (partnerId === "default") {
            whereClause += ` AND packages.partnerId IS NULL`;
        } else if (partnerId) {
            whereClause += ` AND packages.partnerId = :partnerId`;
            replacements.partnerId = partnerId;
        }

        const query = `
        SELECT 
          cashbacks.*, 
          serviceOperators.serviceProvider,
          packages.packageName,
          packages.partnerId,
          credentials.name AS partnerName,
          vendors.vendorName 
        FROM cashbacks
        LEFT JOIN serviceOperators 
          ON cashbacks.serviceOperatorId = serviceOperators.id
        LEFT JOIN vendors 
          ON serviceOperators.vendorId = vendors.id
        LEFT JOIN packages 
          ON cashbacks.packageId = packages.id
        LEFT JOIN credentials 
          ON packages.partnerId = credentials.id
        ${whereClause}
        ORDER BY ${sortField} ${sort}
      `;

        const data = await sequelizeConfig.query(query, {
            replacements,
            type: sequelize.QueryTypes.SELECT,
            raw: true,
            nest: true,
        });

        const finalData = data.map((item) => ({
            Date: item.createdAt
                ? formattedDateTime(item.createdAt)
                : "Not Available",

            "Service Operator":
                item.serviceProvider || "Not Available",

            "Commision Type":
                item.cashbackType || "Not Available",

            "Package Name":
                item.packageName || "Not Available",

            "Vendor Name":
                item.vendorName || "Not Available",

            "Partner Name":
                item.partnerName || "Not Available",

            Surcharge: item.surcharge
                ? "₹ " + formatNumberWithLocalString(item.surcharge)
                : "0.00",

            Cashback: item.cashback
                ? item.cashback + (item.cashbackType === "FLAT" ? "₹" : "%")
                : "Not Available",

            "Base Limit": item.baseLimit || "0.00",
            "Unit Price": item.unitPrice || "0.00",

            Status: item.serviceStatus > 0 ? "Active" : "In Active",
        }));

        return finalData;
    } catch (error) {
        console.log(error);
        throw { message: "Something went wrong" };
    }
});
