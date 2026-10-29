const validateBusinessEmail = require("../services/validateBusinessEmail");
const { customLog } = require("../utils/loggerHelper");

const validateBusinessEmailAmount = async (req, res, next) => {
  try {
     const {planId, formDetails, billingType,amount} = req.body;

    if (!planId || !formDetails || !billingType || !amount) {
      return sendError(res, req.LogTraceId, "Necessary credentials are not passed");
    }

    // Step 1: Calculate cart totals
   const expectedAmount = await validateBusinessEmail({planId,billingType, count: formDetails.numberOfUsers, credentialId: req.user.id});
    if (!expectedAmount || !expectedAmount.status) {
      return sendError(res, req.LogTraceId, "Something went wrong", 500);
    }

    let calculatedAmount = Number(expectedAmount.amount || 0)
  
    customLog(req.LogTraceId, 'info', {expectedAmount, calculatedAmount})

    if (calculatedAmount !==  Number(amount)) {
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

module.exports = validateBusinessEmailAmount;