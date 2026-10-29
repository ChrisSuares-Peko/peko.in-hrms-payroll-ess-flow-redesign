const { findOne } = require("../models/use-cases/softwares_subscriptions_plans");
const { customLog } = require("../utils/loggerHelper");
const { PLAN_COMMISSION } = require("../utils/applyCommissionMarkup");

const validateBusinessEmail = async ({ planId, billingType, count, credentialId }) => {
    try {
      const {data:businessEmail} = await findOne({ params: { id: planId }, attributes:["monthlyPrice", "yearlyPrice", ...PLAN_COMMISSION.fields], productAttribute:null, credentialId });
      if (!businessEmail) {
        return { status: false, message: "Plan not found" };
      }
  
      const priceMap = {
        MONTHLY: businessEmail.dataValues?.monthlyPrice ?? businessEmail.monthlyPrice ?? 0,
        ANNUALLY: businessEmail.dataValues?.yearlyPrice ?? businessEmail.yearlyPrice ?? 0,
      };
  
      const unitPrice = priceMap[billingType];
      if (unitPrice === undefined) {
        return { status: false, message: "Invalid billing type" };
      }
  
      return { status: true, amount: unitPrice * (count ?? 1) };
    } catch (error) {
      customLog(null, "error", { error, message: "Something went wrong" });
      return { status: false, message: error?.message ?? "Something went wrong" };
    }
  };
  

module.exports = validateBusinessEmail;