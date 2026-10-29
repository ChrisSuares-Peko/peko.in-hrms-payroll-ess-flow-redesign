const axios = require("axios");
const {
  findServiceOperatorByAccessKey,
} = require("../utils/checkAndFetchServiceDetails");
const { customLog } = require("../utils/loggerHelper");
const {
  updateCurrencyExchangeRateInDb,
} = require("../models/use-cases/setting");
const operatorsData = require("../utils/operatorsData.json");
const accessKey = operatorsData.currencyExchangeRate.accessKey;

exports.updateCurrencyExchangRate = async () => {
  try {
    const service = await findServiceOperatorByAccessKey(accessKey);
    if (Object.prototype.hasOwnProperty.call(service, "error")) {
      customLog(null, "error", {
        message: "scheduler service - currency exchange rate fetching crone: service operator unavailable.",
        response: service,
      });
      return;
    }

    const API_URL = service.vendor.apiUrl;
    const api_key = service.vendor.optional1;

    const params = new URLSearchParams();
    const base_currency = "INR";
    params.set("base_currency", base_currency);
    params.set("apikey", api_key);

    const config = {
      method: "GET",
      url: `${API_URL}/v3/latest?${params.toString()}`,
      headers: {
        Accept: "application/json",
      },
      // UAT calls take ~6.5-8s; 5s timed out on several runs
      timeout: 15000,
    };

    customLog(null, "info", {
      message: "scheduler service - currency exchange rate crone: fetch api request",
      request: { ...config, url: config.url.replace(/apikey=[^&]*/, "apikey=***") },
    });

    const response = await axios(config);

    customLog(null, "info", {
      message: "scheduler service - currency exchange rate crone: fetch api Response",
      response: response.data,
    });

    if (
      !response?.data?.data ||
      !Object.keys(response?.data?.data).length > 0
    ) {
      customLog(null, "info", {
        message: "scheduler service - currency exchange rate crone: api response is empty",
        response: response.data,
      });
      return;
    }

    await updateCurrencyExchangeRateInDb(response.data.data);
  } catch (error) {
    // axios errors lose response details when serialized, so log them explicitly
    customLog(null, "error", {
      message: "Error: scheduler service - currency exchange rate crone",
      errorMessage: error?.message,
      errorCode: error?.code,
      responseStatus: error?.response?.status,
      responseData: error?.response?.data,
    });
  }
};
