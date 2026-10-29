const esim = require("../entities/esim");
const asyncHandler = require("../../middlewares/async");

exports.getPlanByPlanId = asyncHandler(async (planId) => {
    try {
        const plan = await esim.findOne({
            where: {
                planId: planId,
                status: true,
            },
            attributes: ['amount', 'planId', 'name', 'dataMBs', 'periodDays', 'country'],
            raw: true,
        });

        return plan;
    } catch (error) {
        console.log("Error in getPlanByPlanId:", error);
        return false;
    }
})