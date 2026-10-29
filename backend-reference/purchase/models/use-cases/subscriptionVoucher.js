
const asyncHandler = require("../../middlewares/async");
const SubscriptionVoucher = require("../entities/subscriptionVoucher");
const pkgModel = require("../entities/package");
let sequelizeConfig = require('../../configs/database/index');
const { customLog } = require("../../utils/loggerHelper");

exports.findOne = asyncHandler(async (params) => {

    const { whereClause, attributes = undefined, packageId, partnerId = null } = params
    const packageWhereClause = {
        partnerId: partnerId
    }

    if (packageId) {
        packageWhereClause.id = packageId
    }

    try {
        const subscriptionCode = await SubscriptionVoucher.findOne({
            include: [
                {
                    model: pkgModel,
                    attributes: ["packageName", "packagePrices", "discount", "packageType"],
                    where: packageWhereClause
                },
            ],
            where: whereClause,
            attributes: attributes,
            raw: true,
            nest: true
        })

        return subscriptionCode
    } catch (error) {
        throw { error }
    }
})

exports.createSubscriptionCode = asyncHandler(async (data) => {
    if (!data || data.length <= 0) {
        return false
    }
    try {
        const subscriptionCode = await SubscriptionVoucher.bulkCreate(data)

        return subscriptionCode
    } catch (error) {
        throw { error }
    }
})

// exports.findAllSubscriptionCodes = asyncHandler(async (params) => {
//     try {
//         let { limit, offset, searchText, sort, sortField } = params;


//         let whereConditions = '1=1';
//         let replacements = {
//             limit: limit,
//             offset: offset
//         };

//         if (searchText) {
//             whereConditions += ` AND (
//                 activationCode LIKE :searchText OR 
//                 billingType LIKE :searchText OR 
//                 packageName LIKE :searchText OR
//                 partnerName LIKE :searchText
//             )`;
//             replacements.searchText = `%${searchText}%`;
//         }

//         // Use handleSortFields to get the order clause
//         // const orderClause = handleSortFields(sortField, sort);

//         // Total count query
//         const totalCountQuery = `
//             SELECT COUNT(*) AS totalCount
//             FROM subscription_vouchers
//             WHERE ${whereConditions}
//         `;

//         // Main data query
//         const dataQuery = `
//             SELECT *
//             FROM subscription_vouchers
//             WHERE ${whereConditions}
//             ORDER BY ${sortField} ${sort}
//             LIMIT :limit OFFSET :offset
//         `;

//         // Execute the queries
//         const [result, totalCountResult] = await Promise.all([
//             sequelizeConfig.query(dataQuery, {
//                 replacements: replacements,
//                 type: sequelizeConfig.QueryTypes.SELECT,
//                 nest: true,
//                 raw: true
//             }),
//             sequelizeConfig.query(totalCountQuery, {
//                 replacements: replacements,
//                 type: sequelizeConfig.QueryTypes.SELECT
//             })
//         ]);

//         const totalCount = totalCountResult[0]['totalCount'];

//         return {
//             rows: result,
//             count: totalCount
//         };
//     } catch (error) {
//         throw { error }
//     }
// });


exports.findAllSubscriptionCodes = asyncHandler(async (params) => {
    try {
        let { limit, offset, searchText, sort, sortField } = params;


        let whereConditions = '1=1';
        let replacements = {
            limit: limit,
            offset: offset
        };

        if (searchText) {
            whereConditions += ` AND (
                subscription_vouchers.activationCode LIKE :searchText OR 
                subscription_vouchers.billingType LIKE :searchText OR 
                packages.packageName LIKE :searchText OR
                packages.partnerId LIKE :searchText
            )`;
            replacements.searchText = `%${searchText}%`;
        }

        // Use handleSortFields to get the order clause
        // const orderClause = handleSortFields(sortField, sort);

        // Total count query
        const totalCountQuery = `
            SELECT COUNT(*) AS totalCount
            FROM subscription_vouchers
            LEFT JOIN packages ON subscription_vouchers.packageId = packages.id
            WHERE ${whereConditions}
        `;

        // Main data query
        const dataQuery = `
            SELECT 
                subscription_vouchers.*, 
                packages.packageName, 
                packages.partnerId AS partnerName
            FROM subscription_vouchers
            LEFT JOIN packages ON subscription_vouchers.packageId = packages.id
            WHERE ${whereConditions}
            ORDER BY ${sortField} ${sort}
            LIMIT :limit OFFSET :offset
        `;

        // Execute the queries
        const [result, totalCountResult] = await Promise.all([
            sequelizeConfig.query(dataQuery, {
                replacements: replacements,
                type: sequelizeConfig.QueryTypes.SELECT,
                nest: true,
                raw: true
            }),
            sequelizeConfig.query(totalCountQuery, {
                replacements: replacements,
                type: sequelizeConfig.QueryTypes.SELECT
            })
        ]);

        const totalCount = totalCountResult[0]['totalCount'];
        
        return {
            rows: result,
            count: totalCount
        };
    } catch (error) {
        throw { error }
    }
});

exports.updateSubscriptionCode = asyncHandler(async (data, whereClause) => {
    if (!data) {
        return false
    }

    try {
        const [affectedRows] = await SubscriptionVoucher.update(data, {
            where: whereClause
        })
        return affectedRows > 0
    } catch (error) {
        throw { error }
    }
})

exports.deleteSubscriptionCode = asyncHandler(async (data) => {
    if (!data || !data.id) {
        return false
    }
    try {
        const { id } = data;
        const rowsDeleted = await SubscriptionVoucher.destroy({ where: { id } });
        return rowsDeleted
    } catch (error) {
        throw { error }
    }
})

exports.subscriptionCodeExport = asyncHandler(async (params) => {
    try {
  
     let { searchText } = params;
  
  
          let whereConditions = '1=1';
          let replacements = {};
  
          if (searchText) {
              whereConditions += ` AND (
                  activationCode LIKE :searchText OR 
                  billingType LIKE :searchText OR 
                  packageName LIKE :searchText OR
                  partnerName LIKE :searchText
              )`;
              replacements.searchText = `%${searchText}%`;
          }
          // Main data query
          const dataQuery = `
              SELECT *
              FROM subscriptionVouchers
              WHERE ${whereConditions}
          `;
  
          // Execute the queries
          const [result] = await Promise.all([
              sequelizeConfig.query(dataQuery, {
                  replacements: replacements,
                  type: sequelizeConfig.QueryTypes.SELECT,
                  nest: true,
                  raw: true
              }),
             
          ]);
  
         
      let finalData = [];
      result.forEach(function (limitData) {
        finalData.push({
          "Date": limitData.createdAt|| "Not Available",
          "Activation Code": limitData.activationCode|| "Not Available",
          "Package Name": limitData.packageName || "Not Available",
          "Billing Type": limitData.billingType || "Not Available",
          "Redeemed": limitData.isUsed? "Yes": "NO" || "Not Available",
          "Partner Name": limitData.partnerName || "Not Available",
          "Status": limitData.status || "Not Available",
        });
      });
     
      return finalData;
    } catch (error) {
      console.error(error)
      customLog(null, "error", { message: "An error occurred", error: error });
      throw { message: "Something went wrong" };
    }
  });