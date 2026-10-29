const { customLog } = require("../utils/loggerHelper");
const { getValue } = require("../utils/cacheDataMethods");
const operatorsData = require("../utils/operatorsData.json");
const accessKey = operatorsData["flight"]["accessKey"];

const validateAirlineWalletAmount = async (req, res, next) => {
  try {
    const { outbount } = req.body;

    if (!outbount?.TraceId || !outbount?.amount) {
      return sendError(res, req.LogTraceId, "Necessary credentials are not passed");
    }

    const amount = Number(outbount.amount);

    // Step 1: Retrieve cached amount
    const cachedAmount = await getValue(`${accessKey}-${outbount.TraceId}-paymentAmount`);

    if (!cachedAmount) {
      return sendError(res, req.LogTraceId, "Something went wrong while validating airline amount");
    }

    const calculatedAmount = Number(cachedAmount || 0);

    customLog(req.LogTraceId, "info", { amount, calculatedAmount, traceId: outbount.TraceId });

    // Step 2: Compare
    if (amount !== calculatedAmount) {
      return sendError(res, req.LogTraceId, "Amount mismatch");
    }

    return next();
  } catch (error) {
    customLog(req.LogTraceId, "error", {
      error,
      message: "Error while validating airline wallet amount",
    });
    return sendError(res, req.LogTraceId, "Something went wrong while validating airline wallet amount");
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

module.exports = validateAirlineWalletAmount;
