const axios = require('axios')
const ErrorResponse = require('./error-response')
const { customLog } = require('./loggerHelper')
const { GENERIC_ERROR } = require('../constants/messages')

const API_GATEWAY_URL = (
    (process.env.NODE_ENV === 'staging' ? process.env.STAGING_URL : process.env.PRODUCTION_URL)
    || 'http://localhost:3000'
).replace(/\/+$/, '')

const BASE_PATH = '/api/v1/webhook/corporatecard/officeAndBusiness/e-sign/corporate-card'
const DEFAULT_TIMEOUT_MS = 60000
const STATUS_TIMEOUT_MS = 15000
const RETRY_DELAY_MS = 250
const RETRYABLE_STATUSES = [502, 503, 504]

const UNAVAILABLE_MESSAGE = 'The e-signature service is temporarily unavailable. Please try again.'

const delay = (ms) => new Promise((resolve) => { setTimeout(resolve, ms) })

const isRetryable = (error) => {
    if (error.response) return RETRYABLE_STATUSES.includes(error.response.status)
    return error.code !== 'ECONNABORTED'
}

const request = async ({ method, path, body, params, logTraceId, timeout, retries }) => {
    const secret = process.env.ESIGN_DISPATCH_SECRET
    if (!secret) {
        customLog(logTraceId, 'error', {
            message: '[eSign] ESIGN_DISPATCH_SECRET is not configured — refusing to dispatch',
            path,
        }, 'CONSOLE')
        throw new ErrorResponse(GENERIC_ERROR, 500)
    }

    const config = {
        method,
        url: `${API_GATEWAY_URL}${BASE_PATH}${path}`,
        headers: {
            accept: 'application/json',
            'Content-Type': 'application/json',
            'x-esign-dispatch-secret': secret,
            'x-peko-forwarded-from': 'corporatecard-ms',
            ...(logTraceId ? { 'x-request-id': logTraceId } : {}),
        },
        timeout,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        ...(params ? { params } : {}),
        ...(body !== undefined ? { data: body } : {}),
    }

    let lastError
    for (let attempt = 0; attempt <= retries; attempt += 1) {
        try {
            const { data } = await axios(config)
            if (!data || data.status !== true) {
                customLog(logTraceId, 'error', {
                    message: '[eSign] officeAndBusiness returned an unexpected envelope',
                    path,
                    responseCode: data?.responseCode,
                    upstreamMessage: data?.message,
                }, 'CONSOLE')
                throw new ErrorResponse(GENERIC_ERROR, 502)
            }
            return data.data
        } catch (error) {
            if (error instanceof ErrorResponse) throw error
            lastError = error
            customLog(logTraceId, 'error', {
                message: '[eSign] officeAndBusiness call failed',
                path,
                attempt,
                status: error.response?.status,
                error: error.response?.data || error.message,
            }, 'CONSOLE')
            if (!isRetryable(error) || attempt === retries) break
            await delay(RETRY_DELAY_MS)
        }
    }

    if (lastError?.response) throw new ErrorResponse(GENERIC_ERROR, 502)
    throw new ErrorResponse(UNAVAILABLE_MESSAGE, 503)
}

const dispatchAgreement = (body, { logTraceId } = {}) =>
    request({
        method: 'post',
        path: '/dispatch',
        body,
        logTraceId,
        timeout: DEFAULT_TIMEOUT_MS,
        retries: 0,
    })

const fetchAgreementStatus = (epakId, { logTraceId, includeDocument = false } = {}) =>
    request({
        method: 'get',
        path: '/status',
        params: { epakId, ...(includeDocument ? { includeDocument: 'true' } : {}) },
        logTraceId,
        timeout: includeDocument ? DEFAULT_TIMEOUT_MS : STATUS_TIMEOUT_MS,
        retries: 1,
    })

module.exports = { dispatchAgreement, fetchAgreementStatus, UNAVAILABLE_MESSAGE }
