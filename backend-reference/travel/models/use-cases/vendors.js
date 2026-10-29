const vendor = require('../entities/vendor')

const asyncHandler = require('../../middlewares/async')

exports.findOne = asyncHandler(async (params) => {
     return await vendor.findOne({
          where: params,
     })
})
