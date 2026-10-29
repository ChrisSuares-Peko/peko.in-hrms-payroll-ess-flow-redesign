const plans = require('../entities/plans')
const asyncHandler = require('../../middlewares/async')
const { applyCommissionMarkup } = require('../../utils/applyCommissionMarkup')


exports.fetchSinglePlan = asyncHandler(async (planId, credentialId) => {
    const plan = await plans.findOne({
        where: {
            id: planId,
            status: true
        },
        attributes: {
            exclude: ['createdAt', 'updatedAt']
        }
    });
    await applyCommissionMarkup(plan, 'price', credentialId);
    return plan;
});

