const axios = require("axios");
const { customLog } = require("../utils/loggerHelper");
const esimPlans = require("../models/entities/esim");
const { findOne } = require("../models/use-cases/serviceOperator");
const { getValue, setValue } = require("../utils/cacheDataMethods");
const countries = require("../public/countries.json");
const operatorsData = require("../utils/operatorsData.json");
const { getCurrencyExchangeRate } = require("../models/use-cases/setting");

const countryMap = {};
for (const c of countries) {
  countryMap[c.value] = c.label;
}

async function syncTunzInventory() {
  let created = 0;
  let updated = 0;
  let skipped = 0;

  try {
    customLog(null, "info", {
      message: "Starting Tunz inventory sync"
    });

    const accessKey = operatorsData.eSIMTunz.accessKey;

    const serviceDetails = await findOne({ accessKey });

    if (!serviceDetails) {
      customLog(null, "error", {
        message: "Service details not found"
      });
      return { success: false, reason: "SERVICE_NOT_FOUND" };
    }

    const token = await getToken(serviceDetails.vendor, accessKey);

    if (!token) {
      customLog(null, "error", {
        message: "Failed to fetch Tunz token"
      });
      return { success: false, reason: "TOKEN_FAILED" };
    }

    // 🔁 Retry logic
    let response;
    for (let i = 0; i < 2; i++) {
      try {
        response = await axios.get(
          `${serviceDetails.vendor.apiUrl}/gigastore/products/inventory`,
          {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`
            },
            timeout: 10000
          }
        );
        break;
      } catch (err) {
        if (i === 1) throw err;
      }
    }

    const plans = response?.data?.items || [];

    if (!plans.length) {
      customLog(null, "info", {
        message: "No plans found from Tunz"
      });

      await esimPlans.update(
        { status: false },
        { where: { provider: "tunz" } }
      );

      return {
        success: true,
        total: 0,
        created: 0,
        updated: 0,
        skipped: 0
      };
    }

    const existingPlans = await esimPlans.findAll({
      where: { provider: "tunz" }
    });

    const planMap = new Map(
      existingPlans.map(p => [p.planId, p])
    );

    const exchangeRates = await getCurrencyExchangeRate();
    const usdToInr = exchangeRates?.USD?.value ? 1 / exchangeRates.USD.value : 85;
    const activePlanIds = new Set();

    for (const plan of plans) {
      if (!plan.active) continue;

      const dataMBs =
        plan.sizeUnit === "GB"
          ? plan.sizeValue * 1024
          : plan.sizeValue;

      const periodDays = plan.validitySize;

      const priceObj = plan.prices?.find(
        p => p.currencyCode === "USD"
      );

      const wholesalePriceUSD = Number(priceObj?.priceValue || 0);

      if (!wholesalePriceUSD) {
        skipped++;
        continue;
      }

      const retailPrice = Number((wholesalePriceUSD * usdToInr).toFixed(2));

      const includedCountries = (plan.includedCountries || []).map(code => ({
        code,
        name: countryMap[code] || code
      }));

      const payload = {
        name: plan.name,
        dataMBs: String(dataMBs),
        periodDays: String(periodDays),
        amount: retailPrice,
        vendorWholesalePriceUSD: wholesalePriceUSD,
        includedCountries,
        status: true,
        coverageId: plan.countrySet
      };

      const existingPlan = planMap.get(plan.id);

      if (existingPlan) {
        await existingPlan.update(payload);
        updated++;
      } else {
        await esimPlans.create({
          provider: "tunz",
          planId: plan.id,
          ...payload
        });
        created++;
      }

      activePlanIds.add(plan.id);
    }

    const plansToDisable = existingPlans
      .filter(p => !activePlanIds.has(p.planId))
      .map(p => p.planId);

    if (plansToDisable.length) {
      await esimPlans.update(
        { status: false },
        { where: { provider: "tunz", planId: plansToDisable } }
      );
    }

    customLog(null, "info", {
      message: "Tunz inventory sync completed",
      total: plans.length,
      created,
      updated,
      skipped
    });

    return {
      success: true,
      total: plans.length,
      created,
      updated,
      skipped
    };

  } catch (error) {
    customLog(null, "error", {
      message: "Tunz inventory sync failed",
      error: error?.response?.data || error.message
    });

    throw error;
  }
}

async function getToken(details, accessKey) {
  try {
    const cacheKey = `tunz-io-${accessKey}`;
    const cachedToken = await getValue(cacheKey);

    if (cachedToken) return cachedToken;

    const response = await axios.post(
      `${details.apiUrl}/reseller/authenticate`,
      {},
      {
        auth: {
          username: details.optional1,
          password: details.optional2,
        },
        headers: {
          Accept: "application/json",
        },
        timeout: 10000
      }
    );

    if (response.status === 200 && response.data.accessToken) {
      const token = response.data.accessToken;
      const expiresIn = response.data.expiresIn;

      await setValue(cacheKey, expiresIn - 60, token);

      return token;
    }

    return false;

  } catch (err) {
    customLog(null, "error", {
      message: err?.message,
      data: err?.response?.data,
    });
    return false;
  }
}
module.exports = { syncTunzInventory };