const { default: axios } = require("axios");
const { customLog } = require("./loggerHelper");

async function findCashfreeSubscription({ vendor, vendorSubscriptionId }, LogTraceId = null) {
  const { apiUrl: baseUrl, optional3: version, optional1: clientId, optional2: clientSecret } = vendor;

  const config = {
    method: "GET",
    url: `${baseUrl}/pg/subscriptions/${vendorSubscriptionId}`,
    headers: {
      "x-api-version": version,
      "x-client-id": clientId,
      "x-client-secret": clientSecret,
      "Content-Type": "application/json",
    },
  };

  try {
    customLog(LogTraceId, "info", { method: config.method, url: config.url, message: "Find subscription config" });
    const response = await axios(config);
    customLog(LogTraceId, "info", { message: "Find subscription successfull response" });
    return response.data.plan_details;
  } catch (error) {
    customLog(LogTraceId, "error", { error: error?.message || error, message: "Error in findCashfreeSubscription" });
    return false;
  }
}

async function createCashfreePlan({vendor, plan_id, plan_recurring_amount, plan_name, planDetails}, LogTraceId = null){
    const {apiUrl:baseUrl, optional3:version, optional1: clientId, optional2: clientSecret} = vendor;
    const configPlan = {
        method: "POST",
        url: `${baseUrl}/pg/plans`,
        headers: {
          "x-api-version": version,
          "x-client-id": clientId,
          "x-client-secret": clientSecret,
          "Content-Type": "application/json",
        },
        data: {
          ...planDetails,
          plan_id,
          plan_name,
          plan_recurring_amount,
          plan_max_amount: 14999 //max limit allowed from cashfree for upi/ card
        },
      };
      customLog(LogTraceId, "info", {method: configPlan.method, url: configPlan.url, data: configPlan.data, message: "create plan config"}, "VENDOR")
      let newPlan;
      try {
        newPlan = await axios(configPlan);
        customLog(LogTraceId, "info", { message: "Plan created successfully" });
      } catch (error) {
        const errorResp = error?.response?.data ?? error?.response
        if(errorResp.code === 'plan_already_exists'){
          newPlan = {status: true, data: {plan_id}}        
        }else{
          customLog(LogTraceId, "info", {message: "Plan already exists in cashfree", error: errorResp});
            return {status: false};
        }
      }
      return {status: true, plan_id:newPlan.data.plan_id};
}

async function updateCashfreePlan({vendor, subscription_id, plan_id}, LogTraceId = null){
    const {apiUrl:baseUrl, optional3:version, optional1: clientId, optional2: clientSecret} = vendor;
    const manageConfig = {
        method: "POST",
        url: `${baseUrl}/pg/subscriptions/${subscription_id}/manage`,
        headers: {
          "x-api-version": version,
          "x-client-id": clientId,
          "x-client-secret": clientSecret,
          "Content-Type": "application/json",
        },
        data: {
          subscription_id,
          action: "CHANGE_PLAN",
          action_details: {
            plan_id,
          }
        },
      }
      customLog(LogTraceId, "info", { method: manageConfig.method, url: manageConfig.url, data: manageConfig.data, message: "Update plan config" });
      try {
        const response = await axios(manageConfig);
        customLog(LogTraceId, "info", { data: response.data, message: "Plan updated successfully" });
        return {status: true};
      } catch (error) {
        const errorResp = error?.response?.data ?? error?.response;
        customLog(LogTraceId, "error", { message: "Failed to update plan", error: errorResp });
        return {status:false, error: errorResp.code};
      }
}

module.exports = {
    findCashfreeSubscription,
    updateCashfreePlan,
    createCashfreePlan
}