
const validateHikePayment = require("../services/validateHike");
const { customLog } = require("../utils/loggerHelper");

const validateBusinessEmailAmount = async (req, res, next) => {
  try {
     const {selectedHikes, amount} = req.body;

    if (!selectedHikes || !amount ) {
      return sendError(res, req.LogTraceId, "Necessary credentials are not passed");
    }

    const { status, totalAmount } = await validateHikePayment(req.body, req.user.id);
     if (!status) {
      return sendError(res, req.LogTraceId, "Something went wrong", 500);
    }

    let  calculatedAmount = Number(amount || 0);
  
    customLog(req.LogTraceId, 'info', {amount, calculatedAmount})

    if (calculatedAmount !==  Number(totalAmount)) {
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