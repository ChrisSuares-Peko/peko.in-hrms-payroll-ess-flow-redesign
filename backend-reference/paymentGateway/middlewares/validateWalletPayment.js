
const operatorData = require("../utils/operatorsData.json");
const { customLog } = require("../utils/loggerHelper");
const validateEsimPayment = require("../services/validateEsimPayment");
const { getValue } = require("../utils/cacheDataMethods");

const validateWalletAmount = async (req, res, next) => {
  try {
    const { accessKey, amount, orderGroups } = req.body;

    // Multi-vendor path: orderGroups array present (mixed Bondio + Tunz purchase)
    if (Array.isArray(orderGroups)) {
      customLog(req.LogTraceId, "info", {
        message: "📊 [WALLET VALIDATION] Multi-vendor eSIM order detected",
        orderGroupsCount: orderGroups.length,
        totalReceivedAmount: amount,
      });

      if (!amount) {
        return sendError(res, req.LogTraceId, "amount is required for multi-vendor orders");
      }

      const esimKeys = [
        operatorData?.["eSIM"]?.["accessKey"],
        operatorData?.["eSIMTunz"]?.["accessKey"],
      ];

      let calculatedTotal = 0;
      const groupBreakdown = [];

      for (let groupIndex = 0; groupIndex < orderGroups.length; groupIndex++) {
        const group = orderGroups[groupIndex];

        customLog(req.LogTraceId, "info", {
          message: `📊 [WALLET VALIDATION] Processing orderGroup ${groupIndex + 1}/${orderGroups.length}`,
          accessKey: group.accessKey,
          groupAmount: group.amount,
          ordersCount: group.orders?.length,
        });

        if (!esimKeys.includes(group.accessKey)) {
          return sendError(res, req.LogTraceId, "Invalid access key in orderGroups");
        }

        const { orders, planIds } = group;

        if (!Array.isArray(orders) || !Array.isArray(planIds)) {
          return sendError(res, req.LogTraceId, "orders and planIds arrays are required in each orderGroup");
        }

        if (orders.length !== planIds.length) {
          return sendError(res, req.LogTraceId, "orders and planIds length mismatch in orderGroup");
        }

        const validation = await validateEsimPayment({
          orders,
          planIds,
          amount: group.amount,
          credentialId: req.user.id,
        });

        customLog(req.LogTraceId, "info", {
          message: `📊 [WALLET VALIDATION] OrderGroup ${groupIndex + 1} validation result`,
          accessKey: group.accessKey,
          isValid: validation?.isValid,
          calculatedAmount: validation?.totalAmount,
        });

        if (!validation?.isValid) {
          customLog(req.LogTraceId, "error", {
            message: `❌ [WALLET VALIDATION] OrderGroup validation failed`,
            groupIndex,
            accessKey: group.accessKey,
            validation,
          });
          return sendError(res, req.LogTraceId, "Something went wrong while validating eSIM amount");
        }

        const groupTotal = Number(validation.totalAmount || 0);
        calculatedTotal += groupTotal;

        groupBreakdown.push({
          accessKey: group.accessKey,
          calculatedAmount: groupTotal,
          groupAmount: group.amount,
        });
      }

      customLog(req.LogTraceId, "info", {
        message: "📊 [WALLET VALIDATION] All orderGroups processed - Final totals",
        orderGroups: groupBreakdown,
        totalCalculatedAmount: calculatedTotal,
        totalReceivedAmount: amount,
        difference: Number(amount) - calculatedTotal,
      });

      // For mixed eSIM orders: amount includes surcharge
      // calculatedTotal is base amount only
      // Surcharge can be 0 (no platform fee) or greater (as configured by admin)
      const surchargeAmount = Number(amount) - calculatedTotal;

      // Allow small tolerance for floating-point precision errors (e.g., 0.000000000000113...)
      // Only reject if surcharge is actually negative, not rounding artifacts
      const PRECISION_TOLERANCE = 0.01; // 1 paisa tolerance

      if (surchargeAmount < -PRECISION_TOLERANCE) {
        customLog(req.LogTraceId, "error", {
          message: "AMOUNT MISMATCH - Surcharge is negative!",
          receivedAmount: amount,
          calculatedBaseAmount: calculatedTotal,
          surchargeAmount: surchargeAmount,
          orderGroups: orderGroups.map(g => ({
            accessKey: g.accessKey,
            amount: g.amount,
            ordersCount: g.orders?.length
          })),
          difference: Math.abs(surchargeAmount),
          hint: "Frontend amount is LESS than backend calculation"
        });
        return sendError(res, req.LogTraceId, "Amount mismatch - amount cannot be less than base amount");
      }

      // Surcharge validation: amount should equal base + surcharge
      // Backend will recalculate its own surcharge independently
      customLog(req.LogTraceId, "info", {
        message: "eSIM mixed order surcharge validated",
        baseAmount: calculatedTotal,
        surchargeAmount,
        amount,
        orderGroups: orderGroups.map(g => ({
          accessKey: g.accessKey,
          amount: g.amount
        }))
      });

      return next();
    }

    // Single-vendor path (existing logic)
    if (accessKey === operatorData?.["globalBusinessSetup"]?.["accessKey"]) {
      // Trust FE-provided totalAmount; controller validates against Base93 quote.
      return next();
    }

    if (!accessKey || !amount) {
      return sendError(res, req.LogTraceId, "AccessKey and amount are required");
    }

    let calculatedAmount;

    switch (accessKey) {
      case operatorData?.["eSIM"]?.["accessKey"]:
      case operatorData?.["eSIMTunz"]?.["accessKey"]: {
        const { orders, planIds } = req.body;

        if (!Array.isArray(orders) || !Array.isArray(planIds)) {
          return sendError(
            res,
            req.LogTraceId,
            "orders and planIds arrays are required for eSIM"
          );
        }

        if (orders.length !== planIds.length) {
          return sendError(
            res,
            req.LogTraceId,
            "orders and planIds length mismatch"
          );
        }

        const validation = await validateEsimPayment({
          orders,
          planIds,
          amount,
          credentialId: req.user.id,
        });

        if (!validation?.isValid) {
          return sendError(
            res,
            req.LogTraceId,
            "Something went wrong while validating eSIM amount"
          );
        }

        calculatedAmount = Number(validation.totalAmount || 0);
        break;
      }

      case operatorData["hotel"]["accessKey"]: {
        const { BookingCode } = req.body;
  
        if (!BookingCode) {
          return sendError(res, req.LogTraceId, "BookingCode required for Hotel Booking");
        }

        const cachedAmount = await getValue(`${accessKey}-${BookingCode}-paymentAmount`);
        if (!cachedAmount) return sendError(req, req.LogTraceId, "something went wrong");
      
        calculatedAmount = Number(cachedAmount || 0)
        break;
       
      }

      default:
        return sendError(res, req.LogTraceId, "Invalid access key provided");
    }

    customLog(req.LogTraceId, "info", {
      accessKey,
      amount,
      calculatedAmount,
    });

    // Step 2: Compare provided vs calculated
    if (Number(amount) !== calculatedAmount) {
      return sendError(res, req.LogTraceId, "Amount mismatch");
    }

    return next();
  } catch (error) {
    customLog(req.LogTraceId, "error", {
      error,
      message: "Error while validating wallet amount",
    });
    return sendError(res, req.LogTraceId, "Something went wrong while validating wallet amount");
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

module.exports = validateWalletAmount;
