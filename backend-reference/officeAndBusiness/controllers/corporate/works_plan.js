const asyncHandler = require("../../middlewares/async");
const { findAllPlans, findOnePlan } = require("../../models/use-cases/works_plan");
const ErrorResponse = require("../../utils/error-response");
const { customLog } = require("../../utils/loggerHelper");
const { removeCommissionFields } = require("../../utils/configuredFlag");

// const accessKey = 'peko_works'

exports.findAllWorksPlan = asyncHandler(async (req, res, next) => {
    try {
        let params = req.params
        const result = await findAllPlans({ ...params, credentialId: req.user.id }, ['id', 'name', 'description', 'price', 'billingCycle', 'features', 'popular']);
        if (!result) {
            return next(new ErrorResponse(`Something went wrong while fetching work plans`, 500))
        } else {
            removeCommissionFields(result)
            return res.status(200).json({
                'status': true,
                'data': { data: result },
                'message': 'Fetched all work plans successfully',
                'responseCode': '000'
            })
        }
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
        return res.status(500).json({
            status: false,
            message: "Something went wrong",
            data: {},
            responseCode: '001'
        })
    }
})

exports.findWorkPlanDetails = asyncHandler(async (req, res, next) => {
    try {
        let params = req.params
        const result = await findOnePlan({ ...params, credentialId: req.user.id });
        if (!result) {
            return next(new ErrorResponse(`Something went wrong while fetching works plan details`, 500))
        } else {
            removeCommissionFields(result)
            return res.status(200).json({
                'status': true,
                'data': result,
                'message': 'Fetched works plan details successfully',
                'responseCode': '000'
            })
        }
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Something went wrong",
            data: {},
            responseCode: '001'
        })
    }
})