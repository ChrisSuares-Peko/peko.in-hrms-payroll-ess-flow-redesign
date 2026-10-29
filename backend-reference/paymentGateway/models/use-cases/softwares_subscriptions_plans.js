const softwares_subscriptions_plans = require("../entities/softwares_subscriptions_plans");
const softwares_subscriptions = require("../entities/softwares_subscriptions");
const vendors = require("../entities/vendor");
const usecaseHandler = require("../../utils/usecase-handler");
const { applyCommissionMarkup } = require("../../utils/applyCommissionMarkup");

/**
 * @returns {Promise<{ success: boolean, message: string, data?: any, error?: any }>}
 */
exports.findOne = usecaseHandler(async ({params, attributes, productAttribute, credentialId} ) => {
  const plan = await softwares_subscriptions_plans.findOne({
    include:[
      {
        model: softwares_subscriptions,
        attributes: productAttribute,
        include: [
          {
              model: vendors, 
              attributes:['vendorEmail','vendorName','optional1','apiUrl','optional2']
          },
        ]
      },
    ],
    where: params,
    attributes
  })
  await applyCommissionMarkup(plan, "monthlyPrice", credentialId)
  await applyCommissionMarkup(plan, "yearlyPrice", credentialId)
  return plan
})