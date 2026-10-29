const mobileRechargeProvider = require('./../entities/mobileRechargeProvider')
const { Op } = require('sequelize')
const asyncHandler = require('./../../middlewares/async')
const { handleSortFields } = require('../../utils/sortHandle')
const { PLAN_COMMISSION, reviewedChange } = require('../../utils/configuredFlag')

exports.createOne = asyncHandler(async (params) => {
     return await mobileRechargeProvider.create(params)
})

exports.findAll = asyncHandler(async (params) => {
     let { limit, offset, searchText, sort, sortField } = params

     const order = handleSortFields(sortField || "createdAt", sort || "DESC")

     const where = {}

     if (searchText) {
          where[Op.or] = [
               { providerName: { [Op.like]: `%${searchText}%` } },
          ]
     }

     const queryOptions = {
          where,
          order,
     }

     if (limit) queryOptions.limit = limit
     if (offset !== undefined) queryOptions.offset = offset

     return await mobileRechargeProvider.findAndCountAll(queryOptions)
})

// Backs the corp-facing read-only endpoint: active rows only, name/displayName + id, no pagination.
exports.findAllNamesOnly = asyncHandler(async () => {
     return await mobileRechargeProvider.findAll({
          where: { status: true },
          attributes: ['id', 'providerName', 'displayName'],
          order: [['providerName', 'ASC']],
          raw: true,
     })
})

exports.findByProviderName = asyncHandler(async (providerName) => {
     return await mobileRechargeProvider.findOne({
          where: { providerName },
          raw: true,
     })
})

exports.findById = asyncHandler(async (id) => {
     return await mobileRechargeProvider.findOne({
          where: { id },
          raw: true,
     })
})

exports.updateOne = asyncHandler(async (id, data) => {
     const reviewed = await reviewedChange({
          load: () =>
               mobileRechargeProvider.findOne({
                    where: { id },
                    attributes: PLAN_COMMISSION.fields,
                    raw: true,
               }),
          incoming: data,
          group: PLAN_COMMISSION,
          table: 'mobileRechargeProviders',
          id,
     })
     return await mobileRechargeProvider.update(reviewed, {
          where: { id },
     })
})

exports.updateStatus = asyncHandler(async (params, data) => {
     return await mobileRechargeProvider.update(data, {
          where: { id: params.id },
     })
})

exports.deleteOne = asyncHandler(async (id) => {
     return await mobileRechargeProvider.destroy({
          where: { id },
     })
})
