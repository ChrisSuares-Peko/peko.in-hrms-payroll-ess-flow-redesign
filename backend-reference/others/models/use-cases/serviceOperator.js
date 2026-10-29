/* eslint-disable no-unused-vars */
const serviceOperator = require('./../entities/serviceOperator')
const vendors = require('./../entities/vendor')
const oauth_clients = require('./../entities/oauth_clients')
const pkgModel = require('./../entities/package')
const sequelize = require('../../configs/database/index')
const { Op } = require('sequelize')
const asyncHandler = require('./../../middlewares/async')
const { formatNumberWithLocalString, formattedDateTime } = require('../../utils/formatter')
const { handleSortFields } = require('../../utils/sortHandle')
const cashback = require('../entities/cashback');
const { OPERATOR_COMMISSION, reviewedChange } = require('../../utils/configuredFlag')

exports.create = asyncHandler(async (params) => {

     const serviceOperators = await serviceOperator.create(params)
     return serviceOperators
})
exports.findOne = asyncHandler(async (params) => {
     let whereClause = {
          accessKey: params.accessKey,
     }
     if (params.serviceType) whereClause['serviceType'] = params.serviceType
     return await serviceOperator.findOne({
          include: [
               {
                    model: vendors,
                    attributes: ['apiUrl', 'optional1', 'optional2', 'optional3', 'optional4', 'optional5'],
               },
          ],
          where: whereClause,
          raw: true,
          nest: true,
     })
})
exports.findAllServiceOperator = asyncHandler(async () => {
     return await serviceOperator.findAll({
          where: {
               serviceStatus: true,
          },
     })
})
exports.updateServiceOperator = asyncHandler(async (params, data) => {
     const reviewed = await reviewedChange({
          load: () =>
               serviceOperator.findOne({
                    where: { id: params.id },
                    attributes: OPERATOR_COMMISSION.fields,
                    raw: true,
               }),
          incoming: data,
          group: OPERATOR_COMMISSION,
          table: 'serviceOperators',
          id: params.id,
     })
     return await serviceOperator.update(reviewed, {
          where: {
               id: params.id,
          },
     })
})

exports.updateStatus = asyncHandler(async (params, data) => {
     return await serviceOperator.update(data, {
          where: {
               id: params.id,
          },
     })
})

exports.findAllServiceOperatorCount = asyncHandler(async (params) => {
     let { limit, offset, searchText, sort, sortField } = params;

     const order = handleSortFields(sortField || "createdAt", sort || "DESC");

     const where = {};

     if (searchText) {
          where[Op.or] = [
               { id: { [Op.like]: `%${searchText}%` } },
               { serviceProvider: { [Op.like]: `%${searchText}%` } },
               { accessKey: { [Op.like]: `%${searchText}%` } },
               { serviceStatus: { [Op.like]: `%${searchText}%` } },
               { providerCommission: { [Op.like]: `%${searchText}%` } },
               { serviceImage: { [Op.like]: `%${searchText}%` } },
               { serviceCategory: { [Op.like]: `%${searchText}%` } },
               { remarks: { [Op.like]: `%${searchText}%` } },
               { countryName: { [Op.like]: `%${searchText}%` } },
               { countryCode: { [Op.like]: `%${searchText}%` } },
               { balanceMethod: { [Op.like]: `%${searchText}%` } },
               { commissionType: { [Op.like]: `%${searchText}%` } },
               { "$vendor.vendorName$": { [Op.like]: `%${searchText}%` } },
          ];
     }

     const queryOptions = {
          include: [
               {
                    model: vendors,
                    attributes: ["vendorName", "apiUrl", ["optional1", "token"]],
               },
               {
                    model: oauth_clients,
                    attributes: ["client_id", "client_secret", "client_name", "logo_uri", "redirect_uris", "active"],
               },
          ],
          where,
          order,
     };

     if (limit) queryOptions.limit = limit;
     if (offset !== undefined) queryOptions.offset = offset;

     return await serviceOperator.findAndCountAll(queryOptions);
});


exports.serviceOperatorAndCountExport = asyncHandler(async (params) => {
     try {
          let { searchText, sort, sortField } = params;

          const order = handleSortFields(sortField || "createdAt", sort || "DESC");

          const where = {};

          if (searchText) {
               where[Op.or] = [
                    { id: { [Op.like]: `%${searchText}%` } },
                    { serviceProvider: { [Op.like]: `%${searchText}%` } },
                    { accessKey: { [Op.like]: `%${searchText}%` } },
                    { serviceStatus: { [Op.like]: `%${searchText}%` } },
                    { providerCommission: { [Op.like]: `%${searchText}%` } },
                    { serviceImage: { [Op.like]: `%${searchText}%` } },
                    { serviceCategory: { [Op.like]: `%${searchText}%` } },
                    { remarks: { [Op.like]: `%${searchText}%` } },
                    { countryName: { [Op.like]: `%${searchText}%` } },
                    { countryCode: { [Op.like]: `%${searchText}%` } },
                    { balanceMethod: { [Op.like]: `%${searchText}%` } },
                    { commissionType: { [Op.like]: `%${searchText}%` } },
                    { "$vendor.vendorName$": { [Op.like]: `%${searchText}%` } },
               ];
          }

          const data = await serviceOperator.findAndCountAll({
               include: [
                    {
                         model: vendors,
                         attributes: ["vendorName", "apiUrl", ["optional1", "token"]],
                    },
               ],
               where,
               order,
          });

          const finalData = data.rows.map(limitData => ({
               Date: limitData.createdAt
                    ? formattedDateTime(limitData.createdAt)
                    : "Not Available",
               "Operator Name": limitData.serviceProvider || "Not Available",
               "Access Key": limitData.accessKey || "Not Available",
               "Service Category": limitData.serviceCategory || "Not Available",
               "Commission Type": limitData.commissionType || "Not Available",
               Commission: limitData.providerCommission
                    ? `${formatNumberWithLocalString(limitData.providerCommission, 0)} ${limitData.commissionType === "PERCENTAGE" ? "%" : "₹"
                    }`
                    : "Not Available",
               "Vendor Name": limitData.vendor?.vendorName || "Not Available",
               Status: limitData.serviceStatus ? "Active" : "In Active",
          }));

          return finalData;
     } catch (error) {
          console.log(error);
          throw { message: "Something went wrong" };
     }
});   

exports.fetchServiceOperator = asyncHandler(async (query = "") => {
     return await serviceOperator.findAll({
          where: {
               serviceProvider: {
                    [Op.like]: `%${query}%`,
               },
               serviceStatus: true,
          },
          order: [["serviceProvider", "ASC"]],
          attributes: ["id", "serviceProvider", "serviceCategory","accessKey"],
     })
})

exports.find = asyncHandler(async (params) => {
     return await serviceOperator.findOne({
          where: {
               [Op.or]: [{ serviceProvider: params.serviceProvider }, { accessKey: params.accessKey }],
          },
          raw: true,
     })
})

exports.fetchServiceOperatorTelecomAndUtility = asyncHandler(async (query = "") => {
     return await serviceOperator.findAll({
          where: {
               serviceProvider: {
                    [Op.like]: `%${query}%`,
               },
               serviceStatus: true,
               serviceCategory: {
                    [Op.in]: ["Telecom Payments", "Utility Payments"],
               },
          },
          attributes: ["id", "serviceProvider", "serviceCategory"],
     });
});

exports.getPackageIdsForCashBack = asyncHandler(async (partnerId,packageId) => {
     return await pkgModel.findAll({
         where: {
             partnerId: partnerId,
             status: true,
             id:packageId
         },
         attributes: ['id'],
         raw: true,
         nest: true,
     })    
 })

 exports.checkCashbackServiceOperator = asyncHandler(async (ids,packageIds) => {
     const checkCashBackOperators= await cashback.findAll({
         attributes:['serviceOperatorId'],
         where: {
             [Op.and]: [
                 {
                     serviceOperatorId: {
                         [Op.in]: ids
                     }
                 },
                 {
                     packageId: {
                         [Op.in]: packageIds
                     }
                 }
             ]
 
         }
     })
     const uniqueServiceOperatorIds = [
         ...new Set(checkCashBackOperators.map(item => item.serviceOperatorId))
     ];
 
     return uniqueServiceOperatorIds
 })

exports.findServiceOperatorById = async (id) => {
     return await serviceOperator.findOne({
          include: [{ model: vendors }],
          where: { id },
          raw: true,
          nest: true,
     });
};

exports.findServiceOperatorForHotels = async (accessKey) => {
     return await serviceOperator.findOne({
          include: [{ model: vendors }],
          where: { accessKey },
          raw: true,
          nest: true,
     });
};

 exports.getServiceOperatorsWithOutCashBack = asyncHandler(async (ids) => {
     return await serviceOperator.findAll({
         where: {
             id: {
                 [Op.in]: ids
             },
             serviceStatus: true,
         },
         order: [['serviceProvider', 'ASC']],
         attributes: ['id', 'serviceProvider', 'serviceCategory']
     })    
 })
