const asyncHandler = require("../../middlewares/async");
const messages = require('./../entities/support')
const { Op } = require('sequelize')

module.exports.create = asyncHandler(async (params) => {
    return await messages.create(params);
  });

module.exports.findAllTickets = asyncHandler(async (params) => {
     let {
          from,
          to,
          searchText,
          limit,
          offset,
          corporateId,
          excludeAttribute,
     } = params;

     const whereClause = {};

     if (from && to) {
          const tomorrow = new Date(to);
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(0, 0, 0, 0);

          whereClause.createdAt = {
               [Op.between]: [from, tomorrow],
          };
     }

     if (searchText) {
          whereClause[Op.or] = [
               { id: { [Op.like]: `%${searchText}%` } },
               { issueType: { [Op.like]: `%${searchText}%` } },
               { description: { [Op.like]: `%${searchText}%` } },
          ];
     }

     if (corporateId) {
          whereClause.corporateUserId = corporateId;
     }

     const queryOptions = {
          where: whereClause,
          order: [["createdAt", "DESC"]],
          attributes: {
               exclude: excludeAttribute,
          },
     };

     if (limit) queryOptions.limit = limit;
     if (offset !== undefined) queryOptions.offset = offset;

     return await messages.findAndCountAll(queryOptions);
});


  module.exports.findOneTicket = asyncHandler(async (params) => {
     return await messages.findOne({
          where: {
               id: params.id,
          },
     })
})