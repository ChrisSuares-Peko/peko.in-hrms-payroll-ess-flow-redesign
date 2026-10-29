const plans = require('../entities/plans')
const asyncHandler = require('../../middlewares/async')

exports.fetchSinglePlan = asyncHandler(async (planId) => {
     return await plans.findOne({
          where: {
               id: planId,
          },
          attributes: { exclude: ['createdAt', 'updatedAt'] },
     })
})
