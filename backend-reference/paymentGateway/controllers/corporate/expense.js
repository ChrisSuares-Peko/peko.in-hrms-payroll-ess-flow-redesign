const axios = require("axios");
const { fetchServiceDetails } = require("../../utils/checkAndFetchServiceDetails");
const { findOne: findOneCorporateUser } = require("../../models/use-cases/corporateUser");
const accessKey = "accounting";

exports.createExpense = async (
  serviceDetailsData,
  { accounts_id, amount, payment_method="other", currency = "INR", credentialId, category= "other", merchant= "Peko" }
) => {
  if (isValueEmpty(accounts_id)) {
    const corporateUser = await findOneCorporateUser(
      { corporateId: credentialId },
      ["accounts_id"]
    );
    accounts_id = corporateUser.accounts_id;
  }
  if(isValueEmpty(accounts_id)) {
    console.log("INFO: TRANSACTION IS NOT RECORDED IN ACCOUNTING", typeof accounts_id);
    return
  }
  payment_method = payment_method === "PAYMENT GATEWAY" || payment_method === "CORPORATE CARD" ? "card" : "other"
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
    console.log("🚀 ~Timber api config:", config)
    const response = await axios(config);
    console.log("🚀 ~ exports.expenses=asyncHandler ~ result:", response?.data || response);
    return response?.data || {};
  } catch (error) {
    console.error(
      "Error during external API call for expense creation:",
      error?.response || error
    );
  }
};

  const isValueEmpty = (value) => {
    return value === "" || value === null || value === undefined;
  };