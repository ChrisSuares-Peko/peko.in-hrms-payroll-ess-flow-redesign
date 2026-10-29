const { getPlanByPlanId } = require("../models/use-cases/esimPlans");
const { customLog } = require("../utils/loggerHelper");
const validateEsimPayment = async ({ orders, planIds, amount, credentialId }) => {
    try {
      let totalAmount = 0;
      const planBreakdown = [];

      customLog(null, "info", {
        message: "🔍 [ESIM VALIDATION] Starting eSIM payment validation",
        ordersCount: orders.length,
        planIdsCount: planIds.length,
        receivedAmount: amount,
      });

      for (let i = 0; i < planIds.length; i++) {
        const planId = planIds[i];
        const order = orders[i];

        const esimData = await getPlanByPlanId(planId, credentialId);
        const planAmount = Number(esimData?.amount);
        const qty = Number(order.quantity);
        const itemTotal = planAmount * qty;

        customLog(null, "info", {
          message: `🔍 [ESIM VALIDATION] Plan ${i + 1}/${planIds.length}`,
          planId,
          planPrice: planAmount,
          quantity: qty,
          itemTotal: itemTotal,
          planName: esimData?.name,
          planCountry: esimData?.country,
        });

        if (
          !esimData ||
          Number.isNaN(planAmount) ||
          Number.isNaN(qty) ||
          qty <= 0
        ) {
          customLog(null, "error", {
            message: "❌ Invalid eSIM plan or quantity",
            planId,
            order,
            esimData,
          });
          return { isValid: false, totalAmount: 0 };
        }

        totalAmount += itemTotal;
        planBreakdown.push({
          planId,
          planPrice: planAmount,
          quantity: qty,
          itemTotal: itemTotal
        });
      }

      totalAmount = Number(totalAmount.toFixed(2));
      const receivedAmount = Number(Number(amount).toFixed(2));

      const isValid = totalAmount === receivedAmount;

      customLog(null, "info", {
        message: `✅ [ESIM VALIDATION] Calculation Complete`,
        calculatedTotal: totalAmount,
        receivedAmount: receivedAmount,
        isValid: isValid,
        planBreakdown: planBreakdown,
        difference: Math.abs(totalAmount - receivedAmount),
      });

      if (!isValid) {
        customLog(null, "info", {
          message: "⚠️ [ESIM VALIDATION] Amount mismatch detected!",
          expectedTotal: totalAmount,
          receivedAmount,
          difference: receivedAmount - totalAmount,
          planBreakdown,
        });
      }

      return { isValid, totalAmount };
    } catch (error) {
      customLog(null, "error", {
        message: "❌ [ESIM VALIDATION] Error while validating eSIM payment",
        error: error?.message,
        stack: error?.stack,
      });
      return { isValid: false, totalAmount: 0 };
    }
  };

module.exports = validateEsimPayment;