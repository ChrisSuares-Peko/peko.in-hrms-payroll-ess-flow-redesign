const esim = require("../entities/esimPlan");
const asyncHandler = require("../../middlewares/async");
const { applyCommissionMarkup, PLAN_COMMISSION } = require("../../utils/applyCommissionMarkup");

exports.getPlanByPlanId= asyncHandler(async(planId, credentialId) => {
    try {
        const plan = await esim.findOne({
            where: {
                planId: planId,
                status: true,
            },
            attributes: ['amount', 'planId','name','dataMBs','periodDays','country', ...PLAN_COMMISSION.fields, PLAN_COMMISSION.flag],
            raw: true,
        });

        await applyCommissionMarkup(plan, "amount", credentialId);
        return plan;
    } catch (error) {
        console.log("Error in getPlanByPlanId:", error);
        return false;
    }
})