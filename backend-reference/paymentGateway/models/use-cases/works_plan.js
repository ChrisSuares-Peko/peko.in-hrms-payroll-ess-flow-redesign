const asyncHandler = require("../../middlewares/async");
const usecaseHandler = require("../../utils/usecase-handler");
const works = require("../entities/works");
const work_plans = require("../entities/works_plan");
const { applyCommissionMarkup } = require("../../utils/applyCommissionMarkup");

exports.findOnePlanDetails = asyncHandler(async (params) => {
  return await work_plans.findOne({
    where: {
      id: params.id,
    },
    include: [
      {
        model: works,
      },
    ],
  });
});

exports.findOnePlanDetails = usecaseHandler(async (params) => {
    const plan = await work_plans.findOne({
        where: {
            id: params.id
        },
        include: [
            {
                model: works
            }
        ]
    });
    await applyCommissionMarkup(plan, "price", params.credentialId);
    return plan;
});
