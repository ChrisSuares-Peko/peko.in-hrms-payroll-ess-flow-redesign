const axios = require('axios');
const { Op } = require('sequelize');
const { getValue, setValue } = require('../utils/cacheDataMethods');
const { customLog } = require('../utils/loggerHelper');
const { findServiceOperatorByAccessKey } = require('../utils/checkAndFetchServiceDetails');
const operatorsData = require('../utils/operatorsData.json');
const giftCards = require('../models/entities/giftCard');

const XOXODAY_ACCESS_KEY = operatorsData['xoxoday']['accessKey'];

const ACCESS_TTL  = 14 * 24 * 60 * 60;
const REFRESH_TTL = 30 * 24 * 60 * 60;

const XOXODAY_TOKEN_REQUEST_TIMEOUT = 60000;
const XOXODAY_TOKEN_VALID = 'VALID';
const XOXODAY_TOKEN_REJECTED = 'REJECTED';
const XOXODAY_TOKEN_UNVERIFIED = 'UNVERIFIED';

const isXoxodayTokenRejection = (error) => {
    const status = error?.response?.status;
    return status >= 400 && status < 500 && status !== 408 && status !== 429;
};

async function xoxodayValidateToken(baseUrl, accessToken) {
    try {
        const response = await axios({
            method: 'get',
            url: `${baseUrl}/token`,
            headers: { Authorization: `Bearer ${accessToken}` },
            timeout: XOXODAY_TOKEN_REQUEST_TIMEOUT,
        });
        customLog(null, 'info', { message: '[XoxodayGiftCards] Validate token response', data: response.data }, 'VENDOR');
        return response?.data?.access_token ? XOXODAY_TOKEN_VALID : XOXODAY_TOKEN_REJECTED;
    } catch (error) {
        customLog(null, 'error', {
            message: '[XoxodayGiftCards] Token validation failed',
            error: error?.response?.data || error.message,
            status: error?.response?.status,
            code: error?.code,
        }, 'VENDOR');
        return isXoxodayTokenRejection(error) ? XOXODAY_TOKEN_REJECTED : XOXODAY_TOKEN_UNVERIFIED;
    }
}

async function xoxodayRefreshToken(details, accessKey) {
    const baseUrl              = details.apiUrl;
    const ACCESS_TOKEN_KEY     = `xoxoday-access-token-${accessKey}`;
    const REFRESH_TOKEN_KEY    = `xoxoday-refresh-token-${accessKey}`;
    const NEXT_REFRESH_KEY     = `xoxoday-token-next-refresh-${accessKey}`;
    const clientId             = details.optional1;
    const clientSecret         = details.optional2;

    if (!clientId || !clientSecret) {
        customLog(null, 'error', { message: '[XoxodayGiftCards] clientId or clientSecret missing' }, 'VENDOR');
        return null;
    }

    let refreshToken = await getValue(REFRESH_TOKEN_KEY);
    customLog(null, 'info', { message: '[XoxodayGiftCards] Refresh token from Redis', hasRefreshToken: !!refreshToken }, 'VENDOR');
    if (!refreshToken) refreshToken = details.optional4;

    if (!refreshToken) {
        customLog(null, 'error', { message: '[XoxodayGiftCards] No refresh token available' }, 'VENDOR');
        return null;
    }

    const doRefresh = async (token) => {
        const response = await axios({
            method: 'post',
            url: `${baseUrl}/token/user`,
            headers: { 'Content-Type': 'application/json' },
            data: { grant_type: 'refresh_token', refresh_token: token, client_id: clientId, client_secret: clientSecret },
            timeout: XOXODAY_TOKEN_REQUEST_TIMEOUT,
        });
        return response.data;
    };

    try {
        const tokenData = await doRefresh(refreshToken);
        customLog(null, 'info', { message: '[XoxodayGiftCards] Token refreshed (primary)', hasAccessToken: !!tokenData?.access_token, hasRefreshToken: !!tokenData?.refresh_token }, 'VENDOR');

        if (!tokenData?.access_token) {
            customLog(null, 'error', { message: '[XoxodayGiftCards] Token refresh failed', response: tokenData }, 'VENDOR');
            return null;
        }

        const nextRefreshAt = Date.now() + 12 * 24 * 60 * 60 * 1000;
        await setValue(ACCESS_TOKEN_KEY,  ACCESS_TTL,  tokenData.access_token);
        await setValue(REFRESH_TOKEN_KEY, REFRESH_TTL, tokenData.refresh_token || refreshToken);
        await setValue(NEXT_REFRESH_KEY,  REFRESH_TTL, String(nextRefreshAt));
        customLog(null, 'info', { message: '[XoxodayGiftCards] Access token refreshed', accessKey }, 'VENDOR');
        return tokenData.access_token;

    } catch (error) {
        const errData  = error?.response?.data;
        const isStale  = error?.response?.status === 403 &&
            (errData?.error === 'invalid_request' ||
             errData?.error_description?.toLowerCase().includes('expired') ||
             errData?.error_description?.toLowerCase().includes('invalid'));

        if (isStale) {
            customLog(null, 'error', {
                message: '[XoxodayGiftCards] Refresh token invalid/expired, retrying with latest DB value',
                accessKey,
            }, 'VENDOR');

            await setValue(REFRESH_TOKEN_KEY, 1, '');
            const fresh = await findServiceOperatorByAccessKey(accessKey);
            const freshToken = fresh?.vendor?.optional4;

            if (freshToken && freshToken !== refreshToken) {
                customLog(null, 'info', { message: '[XoxodayGiftCards] Found different refresh token in DB, retrying' }, 'VENDOR');
                try {
                    const retryData = await doRefresh(freshToken);
                    customLog(null, 'info', { message: '[XoxodayGiftCards] Token refreshed (DB fallback)', hasAccessToken: !!retryData?.access_token, hasRefreshToken: !!retryData?.refresh_token }, 'VENDOR');

                    if (!retryData?.access_token) {
                        customLog(null, 'error', { message: '[XoxodayGiftCards] Retry token refresh failed', response: retryData }, 'VENDOR');
                        return null;
                    }

                    const nextRefreshAt = Date.now() + 13 * 24 * 60 * 60 * 1000;
                    await setValue(ACCESS_TOKEN_KEY,  ACCESS_TTL,  retryData.access_token);
                    await setValue(REFRESH_TOKEN_KEY, REFRESH_TTL, retryData.refresh_token || freshToken);
                    await setValue(NEXT_REFRESH_KEY,  REFRESH_TTL, String(nextRefreshAt));
                    customLog(null, 'info', { message: '[XoxodayGiftCards] Access token refreshed via DB fallback', accessKey }, 'VENDOR');
                    return retryData.access_token;
                } catch (retryError) {
                    customLog(null, 'error', {
                        message: '[XoxodayGiftCards] Retry also failed',
                        error: retryError?.response?.data || retryError.message,
                    }, 'VENDOR');
                    return null;
                }
            }

            customLog(null, 'error', {
                message: '[XoxodayGiftCards] DB refresh token same as failed one — manual update required',
                accessKey,
            }, 'VENDOR');
        }

        // Log the vendor's reply or the message only — the axios error object carries the request body (client secret, refresh token)
        customLog(null, 'error', { message: '[XoxodayGiftCards] Error during token refresh', error: error?.response?.data || error?.message }, 'VENDOR');
        return null;
    }
}

async function xoxodayAccessToken(details, accessKey) {
    const baseUrl          = details.apiUrl;
    const ACCESS_TOKEN_KEY  = `xoxoday-access-token-${accessKey}`;
    const REFRESH_TOKEN_KEY = `xoxoday-refresh-token-${accessKey}`;

    const cachedToken        = await getValue(ACCESS_TOKEN_KEY);
    const cachedRefreshToken = await getValue(REFRESH_TOKEN_KEY);
    customLog(null, 'info', { message: '[XoxodayGiftCards] Cached access token', hasCachedToken: !!cachedToken }, 'VENDOR');
    customLog(null, 'info', { message: '[XoxodayGiftCards] Cached refresh token', hasCachedRefreshToken: !!cachedRefreshToken }, 'VENDOR');

    if (cachedToken) {
        const validity = await xoxodayValidateToken(baseUrl, cachedToken);
        if (validity === XOXODAY_TOKEN_VALID) return cachedToken;
        if (validity === XOXODAY_TOKEN_UNVERIFIED) {
            customLog(null, 'info', { message: '[XoxodayGiftCards] Token validation unreachable, using cached token', action: 'xoxoday:token:validationUnreachable', accessKey }, 'VENDOR');
            return cachedToken;
        }
        customLog(null, 'info', { message: '[XoxodayGiftCards] Cached token invalid/expired, refreshing', accessKey }, 'VENDOR');
        await setValue(ACCESS_TOKEN_KEY, 1, '');
    }

    const seedAccessToken  = details.optional3;
    const seedRefreshToken = details.optional4;
    const refreshTokenInCache = await getValue(REFRESH_TOKEN_KEY);

    if (seedAccessToken && !refreshTokenInCache) {
        const isSeedValid = (await xoxodayValidateToken(baseUrl, seedAccessToken)) === XOXODAY_TOKEN_VALID;
        if (isSeedValid) {
            const nextRefreshAt = Date.now() + 13 * 24 * 60 * 60 * 1000;
            await setValue(ACCESS_TOKEN_KEY, ACCESS_TTL, seedAccessToken);
            if (seedRefreshToken) {
                await setValue(REFRESH_TOKEN_KEY, REFRESH_TTL, seedRefreshToken);
                await setValue(`xoxoday-token-next-refresh-${accessKey}`, REFRESH_TTL, String(nextRefreshAt));
            }
            customLog(null, 'info', { message: '[XoxodayGiftCards] Seed access token loaded (first run)', accessKey }, 'VENDOR');
            return seedAccessToken;
        }
        customLog(null, 'info', { message: '[XoxodayGiftCards] Seed token also invalid, attempting refresh', accessKey }, 'VENDOR');
    }

    return await xoxodayRefreshToken(details, accessKey);
}

async function fetchVouchersFromApi(serviceOperator) {
    const accessToken = await xoxodayAccessToken(serviceOperator.vendor, XOXODAY_ACCESS_KEY);
    if (!accessToken) {
        return { status: false, disableOnEmpty: false, message: 'Failed to obtain Xoxoday access token' };
    }

    const baseUrl = serviceOperator.vendor?.apiUrl;
    const config = {
        method: 'post',
        url: `${baseUrl}/api/`,
        timeout: 50000,
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        data: {
            query: 'plumProAPI.mutation.getVouchers',
            tag: 'plumProAPI',
            variables: {
                data: {
                    limit: 0,
                    page: 0,
                    includeProducts: '',
                    excludeProducts: '',
                    exchangeRate: 1,
                    sort: { field: '', order: '' },
                    filters: [
                        { key: 'product', value: '' },
                        { key: 'productName', value: '' },
                        { key: 'country', value: 'India' },
                        { key: 'voucher_category', value: '' },
                        { key: 'minPrice', value: '' },
                        { key: 'maxPrice', value: '' },
                        { key: 'deliveryType', value: '' },
                        { key: 'currencyCode', value: 'INR' },
                    ],
                },
            },
        },
    };

    customLog(null, 'info', {
        message: '[XoxodayGiftCards] getVouchers API request',
        // config.headers carries the Bearer access token — log the target and payload only
        url: config.url,
        method: config.method,
        payload: config.data,
    }, 'VENDOR');

    let response;
    try {
        response = await axios(config);
    } catch (error) {
        customLog(null, 'error', {
            message: '[XoxodayGiftCards] getVouchers API call failed',
            status: error?.response?.status,
            error: error?.response?.data || error.message,
        }, 'VENDOR');
        return { status: false, disableOnEmpty: false, message: 'getVouchers API call failed' };
    }

    customLog(null, 'info', {
        message: '[XoxodayGiftCards] getVouchers API response',
        status: response?.status,
        totalCount: response?.data?.data?.getVouchers?.data?.length ?? null,
    }, 'VENDOR');

    const resData = response?.data?.data?.getVouchers;

    if (!resData || !Array.isArray(resData.data)) {
        customLog(null, 'error', {
            message: '[XoxodayGiftCards] Unexpected API response structure',
            response: response?.data,
        }, 'VENDOR');
        return { status: false, disableOnEmpty: false, message: 'Unexpected response from Xoxoday' };
    }

    if (resData.data.length === 0) {
        // Vendor responded but returned no cards — safe to disable existing catalog
        return { status: false, disableOnEmpty: true, message: 'No vouchers returned from Xoxoday' };
    }

    const giftCardList = resData.data.map(card => {
        const isFixed = card.valueType === 'fixed_denomination';
        const denominations = card.valueDenominations
            ? card.valueDenominations.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v))
            : [];

        return {
            serviceOperatorId: serviceOperator.id,
            product_id:          String(card.productId),
            product_name:        card.name,
            image:               card.imageUrl,
            description:         card.description,
            brand_name:          card.categories || null,
            priceType:           isFixed ? 'FIXED' : 'FLEXI',
            min_price:           isFixed ? (denominations[denominations.length - 1] || 0) : (card.minValue || 0),
            max_price:           isFixed ? (denominations[0] || 0)                        : (card.maxValue || 0),
            denominations,
            terms_and_condition: card.termsAndConditionsInstructions,
            how_to_redeem:       card.redemptionInstructions,
            expiry:              null,
            isAccessible:        true,
            quantityLimit:       card.orderQuantityLimit || null,
            expiryAndValidity:   card.expiryAndValidity || null,
            usageType:           card.usageType || null,
            deliveryType:        card.deliveryType || null,
            tatInDays:           card.tatInDays !== undefined && card.tatInDays !== null && card.tatInDays !== ''
                ? parseInt(card.tatInDays, 10) || 0
                : null,
        };
    });

    customLog(null, 'info', {
        message: '[XoxodayGiftCards] Vouchers fetched from API',
        count: giftCardList.length,
    }, 'VENDOR');

    return { status: true, giftCardList };
}

function sanitizeCard(card) {
    const TEXT_FIELDS = ['product_name', 'brand_name', 'description', 'terms_and_condition', 'how_to_redeem'];
    const sanitized = { ...card };
    TEXT_FIELDS.forEach(field => {
        if (typeof sanitized[field] === 'string') {
            sanitized[field] = sanitized[field]
                .normalize('NFD')
                .replace(/[̀-ͯ]/g, '')
                .replace(/[‘’]/g, "'")
                .replace(/[“”]/g, '"')
                .replace(/[–—]/g, '-')
                .replace(/…/g, '...')
                .replace(/[^ -~\t\n\r]/g, '');
        }
    });
    return sanitized;
}

exports.autoUpdateXoxodayGiftCards = async () => {
    try {
        customLog(null, 'info', { message: '[XoxodayGiftCards] Auto-update started' });

        const serviceOperator = await findServiceOperatorByAccessKey(XOXODAY_ACCESS_KEY);
        if (!serviceOperator || serviceOperator.error) {
            customLog(null, 'error', {
                message: `[XoxodayGiftCards] Service operator not found for accessKey: ${XOXODAY_ACCESS_KEY}`,
            });
            return;
        }

        const serviceOperatorId = serviceOperator.id;
        const fetchResult = await fetchVouchersFromApi(serviceOperator);

        if (!fetchResult.status) {
            customLog(null, 'error', {
                message: `[XoxodayGiftCards] Fetch failed: ${fetchResult.message}`,
            });
            if (fetchResult.disableOnEmpty) {
                await giftCards.update({ isAccessible: false }, { where: { serviceOperatorId } });
                customLog(null, 'info', {
                    message: '[XoxodayGiftCards] All existing cards disabled — vendor returned empty catalog',
                });
            } else {
                customLog(null, 'info', {
                    message: '[XoxodayGiftCards] Skipping catalog update — existing cards left unchanged',
                });
            }
            return;
        }

        const { giftCardList } = fetchResult;

        // Load existing records as Map<product_id, record>
        const existingRecords = await giftCards.findAll({ where: { serviceOperatorId } });
        const existingMap = new Map(existingRecords.map(r => [r.product_id, r]));

        let created = 0, updated = 0, failed = 0;

        await Promise.all(giftCardList.map(async card => {
            const sanitized = sanitizeCard(card);
            const existing = existingMap.get(String(sanitized.product_id));

            if (existing) {
                existingMap.delete(existing.product_id);
                const [count] = await giftCards.update(sanitized, { where: { id: existing.id } });
                count === 1 ? updated++ : failed++;
            } else {
                const created_record = await giftCards.create(sanitized);
                created_record ? created++ : failed++;
            }
        }));

        // Disable any cards not present in the vendor response
        const staleIds = [...existingMap.values()].map(r => r.id);
        let disabled = 0;
        if (staleIds.length > 0) {
            const [disabledCount] = await giftCards.update(
                { isAccessible: false },
                { where: { id: { [Op.in]: staleIds } } }
            );
            disabled = disabledCount;
        }

        customLog(null, 'info', {
            message: '[XoxodayGiftCards] Auto-update complete',
            created,
            updated,
            disabled,
            failed,
        });

    } catch (error) {
        customLog(null, 'error', {
            message: '[XoxodayGiftCards] Unexpected error during auto-update',
            error: error?.response || error.message,
        });
    }
};

// Exposed for the daily vendor wallet report — reuses the cached/refresh token flow so the
// balance check never duplicates Xoxoday's token lifecycle.
exports.xoxodayAccessToken = xoxodayAccessToken;
