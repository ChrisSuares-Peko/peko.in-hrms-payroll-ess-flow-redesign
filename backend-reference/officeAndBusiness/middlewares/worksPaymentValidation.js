
const { findOnePlanDetails } = require("../models/use-cases/works_plan");
const { customLog } = require("../utils/loggerHelper");

const validateworksAmount = async (req, res, next) => {
  try {
    const { amount, planId } = req.body;

    if (!amount || !planId) {
      return sendError(res, req.LogTraceId, "Necessary credentials are not passed");
    }
     const planData = await findOnePlanDetails({ id: req.body?.planId, credentialId: req.user.id })
     
    let calculatedAmount = Number(planData?.price || 0)
    
    if (Number(amount) !== calculatedAmount) {
      return sendError(res, req.LogTraceId, "Amount mismatch");
    }


    return next();
  } catch (error) {
    customLog(req.LogTraceId, "error", { error, message: "Error while validating the amount" });
    return sendError(res, req.LogTraceId, "Something went wrong while validating the amount");
  }
};


function sendError(res, traceId, message, statusCode = 400) {
  customLog(traceId, "error", { message });
  return res.status(statusCode).json({
    status: false,
    data: {},
    message,
    statusCode: "001",
  });
}

module.exports = validateworksAmount;