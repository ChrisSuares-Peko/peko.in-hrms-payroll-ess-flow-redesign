'use strict';

const axios = require('axios');
const { getValue, setValue } = require('./cacheDataMethods');
const { findServiceOperatorByAccessKey } = require('./checkAndFetchServiceDetails');
const { customLog } = require('./loggerHelper');
const operatorsData = require('./operatorsData.json');

const CACHE_KEY = 'reseller_pricing';
const CACHE_TTL = 60 * 60 * 12; // 12 hours

/**
 * Returns parsed pricing data from cache, auto-fetching from vendor if cache is empty.
 * Returns null only if vendor credentials are unavailable or the request fails.
 */
const getPricingData = async (logTraceId = 'SYSTEM') => {
    const cached = await getValue(CACHE_KEY);
    if (cached) return JSON.parse(cached);

    customLog(logTraceId, 'info', { action: 'pricingCache:miss', message: 'Cache empty — fetching from vendor' });

    const serviceOperator = await findServiceOperatorByAccessKey(operatorsData['domainAndHosting']['accessKey']);
    if (!serviceOperator || serviceOperator.error) {
        customLog(logTraceId, 'error', { action: 'pricingCache:fetch', message: `Vendor config not found for ${operatorsData['domainAndHosting']['accessKey']}` });
        return null;
    }

    const authParams = {
        'auth-userid': serviceOperator.vendor.optional1,
        'api-key': serviceOperator.vendor.optional2,
    };
    const baseUrl = serviceOperator.vendor.apiUrl;
    const query = Object.entries(authParams).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');

    try {
        const response = await axios.get(`${baseUrl}/api/products/customer-price.json?${query}`);
        const pricingData = response.data;
        await setValue(CACHE_KEY, CACHE_TTL, JSON.stringify(pricingData));
        customLog(logTraceId, 'info', { action: 'pricingCache:fetched', message: 'Pricing fetched from vendor and cached' });
        return pricingData;
    } catch (err) {
        customLog(logTraceId, 'error', { action: 'pricingCache:fetchFailed', message: 'Failed to fetch pricing from vendor', error: err?.response?.data || err.message });
        return null;
    }
};

module.exports = { getPricingData };
