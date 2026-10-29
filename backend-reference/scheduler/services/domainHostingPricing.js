'use strict';

const axios = require('axios');
const { findServiceOperatorByAccessKey } = require('../utils/checkAndFetchServiceDetails');
const { setValue } = require('../utils/cacheDataMethods');
const { customLog } = require('../utils/loggerHelper');
const operatorsData = require('../utils/operatorsData.json');

const ACCESS_KEY = operatorsData.domainHosting.accessKey;
const CACHE_KEY = 'reseller_pricing';
const CACHE_TTL = 60 * 60 * 12; // 12 hours

exports.refreshDomainHostingPricingCache = async () => {
    try {
        const serviceOperator = await findServiceOperatorByAccessKey(ACCESS_KEY);
        if (!serviceOperator || serviceOperator.error) {
            customLog(null, 'error', { action: 'domainHostingPricing:refresh', message: 'Vendor config not found for domainAndHosting' });
            return;
        }

        const authParams = {
            'auth-userid': serviceOperator.vendor.optional1,
            'api-key': serviceOperator.vendor.optional2,
        };
        const baseUrl = serviceOperator.vendor.apiUrl;
        const query = Object.entries(authParams).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');

        const response = await axios.get(`${baseUrl}/api/products/customer-price.json?${query}`);
        await setValue(CACHE_KEY, CACHE_TTL, JSON.stringify(response.data));

        customLog(null, 'info', { action: 'domainHostingPricing:refresh', message: 'Pricing cache refreshed successfully' });
    } catch (err) {
        customLog(null, 'error', { action: 'domainHostingPricing:refresh', error: err?.message });
    }
};
