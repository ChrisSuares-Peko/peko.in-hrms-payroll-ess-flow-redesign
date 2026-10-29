const axios = require('axios')
const ErrorResponse = require('./error-response')
const { customLog } = require('./loggerHelper')
const { GENERIC_ERROR } = require('../constants/messages')

const API_GATEWAY_URL = (
    (process.env.NODE_ENV === 'production' ? process.env.PRODUCTION_URL : process.env.STAGING_URL)
    || 'http://localhost:3000'
).replace(/\/+$/, '')
const DEFAULT_TIMEOUT_MS = 5000
const RETRY_DELAY_MS = 150
const RETRYABLE_STATUSES = [502, 503, 504]
/**
 * Which of `others`' internal trees a caller's own role maps to.
 *
 * `others` mounts the shared-data surface twice: once under /corporate (scoped to the session's corporate)
 * and once under /system_user (cross-corporate, for admins). An EMPLOYEE is scoped to their corporate exactly
 * as a corporate session is, so they belong on the corporate tree — their own `user` segment has no internal
 * mount at all, which is why every call from an employee session was refused before it was sent.
 *
 * The segment is routing only: every handler on that tree derives the corporate from `req.user.corporateId`,
 * never from the path param, so this cannot widen what a caller can read.
 */
const INTERNAL_TREE = { corporate: 'corporate', user: 'corporate', system_user: 'system_user' }

const UNAVAILABLE_MESSAGE = 'Service temporarily unavailable. Please try again.'

const delay = (ms) => new Promise((resolve) => { setTimeout(resolve, ms) })

const isRetryable = (error) => {
    if (error.response) return RETRYABLE_STATUSES.includes(error.response.status)
    return error.code !== 'ECONNABORTED'
}

const requestContext = (req) => {
    const segments = String(req?.originalUrl || '').split('?')[0].split('/').filter(Boolean)
    const [api, v1, callerType, callerId] = segments
    const userType = INTERNAL_TREE[callerType]
    if (api !== 'api' || v1 !== 'v1' || !userType || !callerId) return null
    if (!req.headers?.authorization || !req.headers?.sessionid) return null

    // On the corporate tree the id segment must be the corporate's. A corporate caller's own segment already
    // is one; an employee's is their user id, which would address a corporate that is not theirs — so theirs
    // comes from the session, and a session without one is refused rather than guessed at.
    const onCorporateTree = userType === 'corporate' && callerType !== 'corporate'
    const userId = onCorporateTree ? req.user?.corporateId : callerId
    if (!userId) return null
    return { userType, userId }
}

const request = async ({ method, path, body, params, req, timeout = DEFAULT_TIMEOUT_MS }) => {
    const logTraceId = req?.LogTraceId
    const context = requestContext(req)
    if (!context) {
        customLog(logTraceId, 'error', {
            message: '[Internal] others call attempted without a usable request context',
            path,
            originalUrl: req?.originalUrl,
        }, 'CONSOLE')
        throw new ErrorResponse(GENERIC_ERROR, 500)
    }

    const url = `${API_GATEWAY_URL}/api/v1/${context.userType}/${encodeURIComponent(context.userId)}/others/internal${path}`
    const config = {
        method,
        url,
        headers: {
            accept: 'application/json',
            'Content-Type': 'application/json',
            authorization: req.headers.authorization,
            sessionid: req.headers.sessionid,
            'x-peko-forwarded-from': 'corporatecard-ms',
            ...(logTraceId ? { 'x-request-id': logTraceId } : {}),
        },
        timeout,
        ...(params ? { params } : {}),
        ...(body !== undefined ? { data: body } : {}),
    }

    let lastError
    for (let attempt = 0; attempt <= 1; attempt += 1) {
        try {
            const { data } = await axios(config)
            if (!data || data.status !== true) {
                customLog(logTraceId, 'error', {
                    message: '[Internal] others returned an unexpected envelope',
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
            const status = error.response?.status
            customLog(logTraceId, 'error', {
                message: '[Internal] others call failed',
                path,
                attempt,
                status,
                error: error.response?.data || error.message,
            }, 'CONSOLE')
            if (!isRetryable(error) || attempt === 1) break
            await delay(RETRY_DELAY_MS)
        }
    }

    if (lastError?.response) {
        throw new ErrorResponse(GENERIC_ERROR, 502)
    }
    throw new ErrorResponse(UNAVAILABLE_MESSAGE, 503)
}

const internalGet = (path, { req, params, timeout } = {}) =>
    request({ method: 'get', path, params, req, timeout })

const internalPost = (path, body, { req, params, timeout } = {}) =>
    request({ method: 'post', path, body, params, req, timeout })

module.exports = { internalGet, internalPost, UNAVAILABLE_MESSAGE }
