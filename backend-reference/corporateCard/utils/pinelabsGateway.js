const axios = require('axios')
const { getValue, setValue, deleteValue } = require('./cacheDataMethods')
const { customLog } = require('./loggerHelper')
const { findServiceOperatorByAccessKey, fetchServiceDetails } = require('./checkAndFetchServiceDetails')
const operatorsData = require('./operatorsData.json')
const { GENERIC_ERROR } = require('../constants/messages')
const {
    PINELABS_SIGNIN_PATH,
    PINELABS_REFRESH_PATH,
    PINELABS_REFRESH_TOKEN_HEADER,
    PINELABS_SUCCESS_CODE,
    REFRESH_TTL,
    EXPIRY_SAFETY_WINDOW_SECONDS,
    tokenCacheKey,
    refreshCacheKey,
} = require('../constants/pinelabs')

const DEFAULT_ACCESS_KEY = operatorsData['corporateCards']['accessKey']

// F-CC-16: cardholder PII masked out of vendor request/response logs.
const SENSITIVE_LOG_FIELDS = ['name', 'mobile', 'mobileNumber', 'email', 'pan', 'accountNumber', 'cardNumber', 'cvv', 'maskedCardNumber', 'dateOfBirth', 'dob', 'customerSignature']

// F-CC-15: default timeout so a stalled Pine Labs response can't hang the request thread indefinitely.
const PINELABS_DEFAULT_TIMEOUT_MS = 30000

const pinelabsCredsFromService = (serviceOperator) => {
    const vendor = serviceOperator?.vendor || {}
    if (!vendor.apiUrl || !vendor.optional1 || !vendor.optional2) return null
    return { baseUrl: vendor.apiUrl, username: vendor.optional1, apiKey: vendor.optional2 }
}

const resolvePinelabsVendor = async (accessKey, req) => {
    const serviceOperator = await findServiceOperatorByAccessKey(accessKey, req)
    if (!serviceOperator || serviceOperator.error) return null
    return pinelabsCredsFromService(serviceOperator)
}

const getCachedRefreshToken = (accessKey) => getValue(refreshCacheKey(accessKey))

const parseAuthResponse = (data) => {
    if (!data || Number(data.responseCode) !== PINELABS_SUCCESS_CODE || !data.token) return null
    return {
        token: data.token,
        expiresIn: Number(data.expiresIn) || 0,
        refreshToken: data.refreshToken || null,
    }
}

const cacheTokens = async (accessKey, parsed) => {
    const accessTtl = parsed.expiresIn > EXPIRY_SAFETY_WINDOW_SECONDS
        ? parsed.expiresIn - EXPIRY_SAFETY_WINDOW_SECONDS
        : parsed.expiresIn
    if (accessTtl > 0) {
        await setValue(tokenCacheKey(accessKey), accessTtl, parsed.token)
    }
    if (parsed.refreshToken) {
        await setValue(refreshCacheKey(accessKey), REFRESH_TTL, parsed.refreshToken)
    }
}

const pinelabsSignin = async (creds, accessKey, logTraceId) => {
    try {
        customLog(logTraceId, 'info', {
            message: '[Pinelabs] Signin request',
            url: `${creds.baseUrl}${PINELABS_SIGNIN_PATH}`,
            username: creds.username,
        }, 'VENDOR')

        if (process.env.NODE_ENV === 'staging') {
            customLog(logTraceId, 'info', {
                message: '[Pinelabs][DEBUG] Signin full request payload',
                method: 'post',
                url: `${creds.baseUrl}${PINELABS_SIGNIN_PATH}`,
                headers: { accept: 'application/json', 'Content-Type': 'application/json' },
                body: { username: creds.username, apiKey: '<redacted>' },
            }, 'VENDOR')
        }

        const { data } = await axios({
            method: 'post',
            url: `${creds.baseUrl}${PINELABS_SIGNIN_PATH}`,
            headers: { accept: 'application/json', 'Content-Type': 'application/json' },
            data: { username: creds.username, apiKey: creds.apiKey },
        })

        const parsed = parseAuthResponse(data)
        if (!parsed) {
            customLog(logTraceId, 'error', {
                message: '[Pinelabs] Signin did not return a valid token',
                responseCode: data?.responseCode,
                responseMessage: data?.responseMessage,
            }, 'VENDOR')
            return null
        }

        await cacheTokens(accessKey, parsed)
        customLog(logTraceId, 'info', { message: '[Pinelabs] Signin successful', expiresIn: parsed.expiresIn }, 'VENDOR')
        return parsed
    } catch (error) {
        customLog(logTraceId, 'error', {
            message: '[Pinelabs] Signin API call failed',
            status: error?.response?.status,
            error: error?.response?.data || error.message,
        }, 'VENDOR')
        return null
    }
}

const pinelabsRefresh = async (creds, refreshToken, accessKey, logTraceId) => {
    try {
        customLog(logTraceId, 'info', {
            message: '[Pinelabs] Refresh token request',
            url: `${creds.baseUrl}${PINELABS_REFRESH_PATH}`,
        }, 'VENDOR')

        if (process.env.NODE_ENV === 'staging') {
            customLog(logTraceId, 'info', {
                message: '[Pinelabs][DEBUG] Refresh full request payload',
                method: 'post',
                url: `${creds.baseUrl}${PINELABS_REFRESH_PATH}`,
                headers: {
                    accept: 'application/json',
                    'Content-Type': 'application/json',
                    [PINELABS_REFRESH_TOKEN_HEADER]: '<redacted>',
                },
                body: undefined,
            }, 'VENDOR')
        }

        const { data } = await axios({
            method: 'post',
            url: `${creds.baseUrl}${PINELABS_REFRESH_PATH}`,
            headers: {
                accept: 'application/json',
                'Content-Type': 'application/json',
                [PINELABS_REFRESH_TOKEN_HEADER]: refreshToken,
            },
        })

        const parsed = parseAuthResponse(data)
        if (!parsed) {
            customLog(logTraceId, 'error', {
                message: '[Pinelabs] Refresh did not return a valid token',
                responseCode: data?.responseCode,
                responseMessage: data?.responseMessage,
            }, 'VENDOR')
            return null
        }

        await cacheTokens(accessKey, parsed)
        customLog(logTraceId, 'info', { message: '[Pinelabs] Token refreshed', expiresIn: parsed.expiresIn }, 'VENDOR')
        return parsed
    } catch (error) {
        customLog(logTraceId, 'error', {
            message: '[Pinelabs] Refresh API call failed',
            status: error?.response?.status,
            error: error?.response?.data || error.message,
        }, 'VENDOR')
        return null
    }
}

const acquireAccessToken = async (accessKey, logTraceId, providedCreds, req) => {
    const creds = providedCreds || await resolvePinelabsVendor(accessKey, req)
    if (!creds) {
        customLog(logTraceId, 'error', { message: '[Pinelabs] Vendor credentials not configured', accessKey }, 'VENDOR')
        return null
    }

    const refreshToken = await getCachedRefreshToken(accessKey)
    if (refreshToken) {
        const refreshed = await pinelabsRefresh(creds, refreshToken, accessKey, logTraceId)
        if (refreshed) return refreshed.token
        customLog(logTraceId, 'info', { message: '[Pinelabs] Refresh failed — falling back to signin', accessKey }, 'VENDOR')
    }

    const signedIn = await pinelabsSignin(creds, accessKey, logTraceId)
    return signedIn ? signedIn.token : null
}

const inFlightByAccessKey = new Map()

const getPinelabsAccessToken = async (accessKey = DEFAULT_ACCESS_KEY, logTraceId, { forceRefresh = false, creds, req } = {}) => {
    if (forceRefresh) {
        await deleteValue(tokenCacheKey(accessKey))
    } else {
        const cached = await getValue(tokenCacheKey(accessKey))
        if (cached) return cached
    }

    const existing = inFlightByAccessKey.get(accessKey)
    if (existing) return existing

    const acquisition = acquireAccessToken(accessKey, logTraceId, creds, req)
        .finally(() => inFlightByAccessKey.delete(accessKey))
    inFlightByAccessKey.set(accessKey, acquisition)
    return acquisition
}

const pinelabsRequest = async ({ method, path, body, headers = {}, accessKey = DEFAULT_ACCESS_KEY, creds, req, logTraceId, label, timeout = PINELABS_DEFAULT_TIMEOUT_MS, suppressErrorLog = false }) => {
    const tag = label || path

    const vendor = creds || await resolvePinelabsVendor(accessKey, req)
    if (!vendor || !vendor.baseUrl) {
        customLog(logTraceId, 'error', { message: '[Pinelabs] Vendor not configured', accessKey, label: tag }, 'VENDOR')
        return { ok: false, error: 'VENDOR_NOT_CONFIGURED' }
    }

    const call = async (forceRefresh) => {
        const token = await getPinelabsAccessToken(accessKey, logTraceId, { forceRefresh, creds: vendor, req })
        if (!token) return { ok: false, error: 'AUTH_FAILED' }

        const url = `${vendor.baseUrl}${path}`
        customLog(logTraceId, 'info', { message: `[Pinelabs] ${tag} request`, url, method }, 'VENDOR')

        if (process.env.NODE_ENV === 'staging') {
            customLog(logTraceId, 'info', {
                message: `[Pinelabs][DEBUG] ${tag} full request payload`,
                method,
                url,
                headers: {
                    accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer <redacted>',
                    ...headers,
                },
                body,
            }, 'VENDOR', SENSITIVE_LOG_FIELDS)
        }

        const { data } = await axios({
            method,
            url,
            headers: {
                accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                ...headers,
            },
            ...(body !== undefined ? { data: body } : {}),
            ...(timeout ? { timeout } : {}),
        })
        return { ok: true, data, responseCode: data?.responseCode, responseMessage: data?.responseMessage }
    }

    try {
        const first = await call(false)
        if (first.error === 'AUTH_FAILED') {
            customLog(logTraceId, 'error', { message: `[Pinelabs] ${tag} could not obtain a token`, accessKey }, 'VENDOR')
        }
        return first
    } catch (error) {
        const status = error?.response?.status
        if (status === 401) {
            customLog(logTraceId, 'info', { message: `[Pinelabs] ${tag} 401 — retrying with refreshed token`, accessKey }, 'VENDOR')
            try {
                return await call(true)
            } catch (retryError) {
                customLog(logTraceId, 'error', {
                    message: `[Pinelabs] ${tag} failed after refresh`,
                    status: retryError?.response?.status,
                    error: retryError?.response?.data || retryError.message,
                }, 'VENDOR')
                return { ok: false, status: retryError?.response?.status, error: retryError?.response?.data || retryError.message, noResponse: !retryError?.response }
            }
        }
        customLog(logTraceId, suppressErrorLog ? 'info' : 'error', {
            message: `[Pinelabs] ${tag} ${suppressErrorLog ? 'returned a non-success response (expected — handled by caller)' : 'failed'}`,
            status,
            error: error?.response?.data || error.message,
        }, 'VENDOR')
        return { ok: false, status, error: error?.response?.data || error.message, noResponse: !error?.response }
    }
}

const isPinelabsSuccess = (result) =>
    !!result && result.ok === true && Number(result.data?.responseCode) === PINELABS_SUCCESS_CODE

const resolvePinelabsCredsForRequest = async (req, accessKey = DEFAULT_ACCESS_KEY) => {
    const serviceDetails = await fetchServiceDetails({
        credentialId: req?.user?.id,
        accessKey,
        packageId: req?.user?.packageId,
        corporateUserId: req?.user?.corporateId,
        req,
    })
    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
        return { error: serviceDetails.error, statusCode: 400 }
    }
    const creds = pinelabsCredsFromService(serviceDetails)
    if (!creds) {
        return { error: GENERIC_ERROR, statusCode: 502 }
    }
    return { creds, serviceDetails }
}

module.exports = {
    getPinelabsAccessToken,
    pinelabsRequest,
    isPinelabsSuccess,
    pinelabsCredsFromService,
    resolvePinelabsCredsForRequest,
    DEFAULT_ACCESS_KEY,
}
