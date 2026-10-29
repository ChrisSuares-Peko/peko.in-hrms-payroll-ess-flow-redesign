/**
 * Tunz Authentication Utility
 * Handles token generation and caching for Tunz API
 * Tunz uses basic auth (username + password) to generate access tokens
 */

const axios = require('axios');
const { customLog } = require('./loggerHelper');
const { setValue, getValue } = require('./cacheDataMethods');

/**
 * Get Tunz authentication token
 * Tokens are cached with TTL to reduce API calls
 * @param {Object} vendorDetails - Vendor details containing apiUrl, optional1 (username), optional2 (password)
 * @param {string} accessKey - Access key for cache key generation
 * @returns {string|false} - Access token or false on failure
 */
async function getToken(vendorDetails, accessKey) {
  try {
    const cacheKey = `tunz-io-${accessKey}`;
    const cachedToken = await getValue(cacheKey);

    if (cachedToken) {
      customLog(null, 'info', {
        message: '[TUNZ AUTH] Using cached token',
        cacheKey,
      });
      return cachedToken;
    }

    customLog(null, 'info', {
      message: '[TUNZ AUTH] Fetching new token from Tunz API',
      apiUrl: vendorDetails.apiUrl,
    });

    const response = await axios.post(
      `${vendorDetails.apiUrl}/reseller/authenticate`,
      {},
      {
        auth: {
          username: vendorDetails.optional1,
          password: vendorDetails.optional2,
        },
        headers: {
          Accept: 'application/json',
        },
      }
    );

    if (response.status === 200 && response.data.accessToken) {
      const token = response.data.accessToken;
      const expiresIn = response.data.expiresIn; // seconds

      // Store token in cache (subtract 60 sec buffer for safety)
      await setValue(cacheKey, expiresIn - 60, token);

      customLog(null, 'info', {
        message: '[TUNZ AUTH] Token generated and cached',
        expiresIn,
        cacheKeyTTL: expiresIn - 60,
      });

      return token;
    }

    customLog(null, 'error', {
      message: '[TUNZ AUTH] Invalid response from Tunz',
      status: response.status,
      data: response.data,
    });
    return false;
  } catch (err) {
    customLog(null, 'error', {
      message: '[TUNZ AUTH] Failed to authenticate',
      error: err?.message,
      responseData: err?.response?.data,
      status: err?.response?.status,
    });
    return false;
  }
}

module.exports = { getToken };
