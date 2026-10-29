const axios = require("axios");
const { fetchServiceDetails } = require("../../utils/checkAndFetchServiceDetails");
const { findOne: findOneCorporateUser } = require("../../models/use-cases/corporateUser");
const { customLog } = require("../../utils/loggerHelper");
const accessKey = "accounting";

exports.createExpense = async (
  serviceDetailsData,
  { accounts_id, amount, payment_method="other", currency = "AED", credentialId, category= "other", merchant= "Peko" }
) => {
  if (isValueEmpty(accounts_id)) {
    const corporateUser = await findOneCorporateUser(
      { id: credentialId },
      ["accounts_id"]
    );
    accounts_id = corporateUser.accounts_id;
  }
  if(isValueEmpty(accounts_id)) {
    return
  }
  payment_method = payment_method === "PAYMENT GATEWAY" ? "card" : "other"
  serviceDetailsData.accessKey = accessKey;
  const serviceDetails = await fetchServiceDetails(serviceDetailsData);
  const { apiUrl, optional1: apiKey, type } = serviceDetails.vendor;
  const config = {
    method: "post",
    url: `${apiUrl}/user/partner/external/expenses/${accounts_id}`,
    maxBodyLength: Infinity,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    data: {
      type: type,
      date: new Date(),
      category,
      merchant,
      amount,
      payment_method,
      currency,
    },
  };
  try {
    
    const response = await axios(config);
    
    return response?.data || {};
  } catch (error) {
    customLog(null, "error", { message: "An error occurred", error: error });
  }
};

  const isValueEmpty = (value) => {
    return value === "" || value === null || value === undefined;
  };