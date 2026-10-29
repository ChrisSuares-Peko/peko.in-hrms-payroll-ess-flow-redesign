const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const internalSharedData = require('../../models/use-cases/internalSharedData')
const notificationUseCase = require('../../models/use-cases/notification')
const { grantCardMembership } = require('../../models/use-cases/cardMembershipGrant')

// Controllers for the internal shared-data endpoints consumed by the corporateCard service. Calls
// arrive THROUGH the api-gateway on the standard user trees (/corporate/:corporateId/others/internal
// and /system_user/:userId/others/internal), so the gateway has already authenticated the session and
// verifyToken has parsed req.user — corporate scope and identity are derived from the SESSION, never
// from client-supplied params. The operator/entitlement endpoints return vendor credentials, so their
// accessKey is allowlisted to the one service this surface exists for.
// Ids travel as strings end-to-end (BIGINT-safe over JSON). "Not found" is a 200 with null/empty data
// so the calling client only treats transport/authorization problems as errors.

const BATCH_IDS_MAX = 200
const SEARCH_IDS_MAX = 1000
const PICKABLE_LIMIT_MAX = 100
// ids/excludeIds member filters travel as comma-separated query params — keep the URL bounded.
const FILTER_IDS_MAX = 500
// Vendor credentials (Pine Labs apiUrl/username/apiKey) transit the operator + entitlement routes —
// bound what they can ever disclose to the single accessKey the corporateCard service resolves.
const ALLOWED_ACCESS_KEYS = ['corporate_cards']

const ok = (res, data, message = 'Success') =>
    res.status(200).json({ status: true, message, data, responseCode: '000' })

const isId = (value) => /^\d+$/.test(String(value))

// Validate an incoming id array: must be an array of numeric ids within the cap. Returns the ids as strings.
const parseIds = (value, { max, field }) => {
    if (!Array.isArray(value)) throw new ErrorResponse(`${field} must be an array.`, 400)
    if (value.length > max) throw new ErrorResponse(`${field} accepts at most ${max} ids per call.`, 400)
    if (!value.every(isId)) throw new ErrorResponse(`${field} must contain only numeric ids.`, 400)
    return value.map(String)
}

const parseRequiredId = (value, field) => {
    if (!isId(value)) throw new ErrorResponse(`A valid ${field} is required.`, 400)
    return String(value)
}

// The calling corporate's id, from the gateway-verified session (never from the URL or query).
const sessionCorporateId = (req) => parseRequiredId(req.user?.corporateId, 'session corporateId')

const parseLimit = (value, { fallback, max }) => {
    if (value === undefined || value === '') return fallback
    const parsed = Number.parseInt(value, 10)
    if (Number.isNaN(parsed) || parsed < 1) throw new ErrorResponse('limit must be a positive integer.', 400)
    return Math.min(parsed, max)
}

const parseOffset = (value) => {
    if (value === undefined || value === '') return 0
    const parsed = Number.parseInt(value, 10)
    if (Number.isNaN(parsed) || parsed < 0) throw new ErrorResponse('offset must be a non-negative integer.', 400)
    return parsed
}

// Optional comma-separated numeric id list in a query param → string[] (undefined when absent).
const parseIdListParam = (value, field) => {
    if (value === undefined || value === '') return undefined
    if (typeof value !== 'string') throw new ErrorResponse(`${field} must be a comma-separated id list.`, 400)
    return parseIds(value.split(','), { max: FILTER_IDS_MAX, field })
}

// Strict: only the literal 'true' opts in. Loose truthiness would let any stray value un-hide the account
// holder's row on a listing that deliberately excludes it by default.
const parseBoolParam = (value, field) => {
    if (value === undefined || value === '') return false
    if (value !== 'true' && value !== 'false') throw new ErrorResponse(`${field} must be true or false.`, 400)
    return value === 'true'
}

const parseServiceLabel = (value) => {
    if (!internalSharedData.isValidServiceLabel(value)) {
        throw new ErrorResponse('A valid serviceLabel is required.', 400)
    }
    return value
}

const parseStatus = (value) => {
    if (value === undefined || value === '') return undefined
    if (!internalSharedData.VALID_MEMBERSHIP_STATUSES.includes(value)) {
        throw new ErrorResponse('Invalid status.', 400)
    }
    return value
}

const parseSearchText = (value) => {
    const text = typeof value === 'string' ? value.trim() : ''
    if (!text) throw new ErrorResponse('searchText is required.', 400)
    return text
}

const NOTIFICATION_FIELD_MAX = { notificationTitle: 255, notificationBrief: 2000, notificationCategory: 100, notificationTo: 255, notificationBy: 100 }
const parseNotificationField = (value, field) => {
    const text = typeof value === 'string' ? value.trim() : ''
    if (!text) throw new ErrorResponse(`${field} is required.`, 400)
    return text.slice(0, NOTIFICATION_FIELD_MAX[field])
}

// ---- Corporate tree (/corporate/:corporateId/others/internal) — scope = the session's corporate ----

// Resolves a corporate's employees by id. Scoped to the session's corporate, so a batch can only ever
// resolve the caller's own people.
exports.batchCardUsers = asyncHandler(async (req, res) => {
    const corporateId = sessionCorporateId(req)
    const serviceLabel = parseServiceLabel(req.query.serviceLabel)
    const ids = req.body?.ids === undefined
        ? []
        : parseIds(req.body.ids, { max: BATCH_IDS_MAX, field: 'ids' })
    if (!ids.length) return ok(res, { rows: [] })

    const rows = await internalSharedData.findCardUsersByIds(ids, corporateId, serviceLabel)
    return ok(res, { rows })
})

exports.searchCardUserIds = asyncHandler(async (req, res) => {
    const corporateId = sessionCorporateId(req)
    const searchText = parseSearchText(req.query.searchText)
    const limit = parseLimit(req.query.limit, { fallback: SEARCH_IDS_MAX, max: SEARCH_IDS_MAX })
    const fields = typeof req.query.fields === 'string' && req.query.fields
        ? req.query.fields.split(',').map((f) => f.trim())
        : internalSharedData.SEARCHABLE_MEMBER_FIELDS
    const searchFields = fields.filter((f) => internalSharedData.SEARCHABLE_MEMBER_FIELDS.includes(f))
    if (!searchFields.length) throw new ErrorResponse('fields must include name and/or email.', 400)

    const result = await internalSharedData.searchCardUserIds({ corporateId, searchText, fields: searchFields, limit })
    return ok(res, result)
})

exports.listCardUsers = asyncHandler(async (req, res) => {
    const corporateId = sessionCorporateId(req)
    const serviceLabel = parseServiceLabel(req.query.serviceLabel)
    const limit = parseLimit(req.query.limit, { fallback: 10, max: SEARCH_IDS_MAX })
    const offset = parseOffset(req.query.offset)
    const status = parseStatus(typeof req.query.status === 'string' ? req.query.status : undefined)
    const searchText = typeof req.query.searchText === 'string' ? req.query.searchText : undefined
    const ids = parseIdListParam(req.query.ids, 'ids')
    const excludeIds = parseIdListParam(req.query.excludeIds, 'excludeIds')
    const includeOwner = parseBoolParam(req.query.includeOwner, 'includeOwner')
    // Which row to float to the top when it is not the account holder's. Validated as an id because it
    // reaches an ORDER BY expression.
    const pinUserId = req.query.pinUserId
        ? parseRequiredId(req.query.pinUserId, 'pinUserId')
        : undefined

    const { count, rows } = await internalSharedData.findAndCountCardUsers({
        corporateId, serviceLabel, status, searchText, ids, excludeIds, includeOwner, pinUserId, limit, offset,
    })
    return ok(res, { count, rows })
})

exports.listCardUserIds = asyncHandler(async (req, res) => {
    const corporateId = sessionCorporateId(req)
    const serviceLabel = parseServiceLabel(req.query.serviceLabel)
    const includeOwner = parseBoolParam(req.query.includeOwner, 'includeOwner')
    // `members` carries the mobile each KYC row is filed under; `ids` stays for callers that only count.
    const members = await internalSharedData.listCardUserIdentities({ corporateId, serviceLabel, includeOwner })
    return ok(res, {
        ids: members.map((m) => String(m.id)),
        members: members.map((m) => ({ id: String(m.id), mobileNo: m.mobileNo ?? null })),
    })
})

// The session corporate's OWNER employee row — the identity that lets the account holder act as an Employee.
// Scoped to the session like every other endpoint here, so a caller can only ever resolve their own
// corporate's. Null until the owner first switches to Employee.
exports.getOwnerProfile = asyncHandler(async (req, res) => {
    const corporateId = sessionCorporateId(req)
    const serviceLabel = parseServiceLabel(req.query.serviceLabel)
    const row = await internalSharedData.findOwnerProfile({ corporateId, serviceLabel })
    return ok(res, { row: row || null })
})

exports.getCardUserScoped = asyncHandler(async (req, res) => {
    const userId = parseRequiredId(req.params.userId, 'userId')
    const corporateId = sessionCorporateId(req)
    const serviceLabel = parseServiceLabel(req.query.serviceLabel)
    const row = await internalSharedData.findCardUserScoped({ userId, corporateId, serviceLabel })
    return ok(res, { row: row || null })
})

exports.getSelfCorporate = asyncHandler(async (req, res) => {
    const corporateId = sessionCorporateId(req)
    const rows = await internalSharedData.findCorporatesByIds([corporateId])
    return ok(res, { row: rows[0] || null })
})

// Persists a notification into the shared notifications table (read by the FE's central notification
// bell via GET /:userType/:userId/others/notification) and fires the same Pusher event the rest of the
// platform uses. Exists so services with their own database (corporateCard) can still reach the one
// table the FE actually reads. notificationTo travels as-is — the caller has already resolved it (either
// via getSelfCorporate above, or from its own previously-stored data), matching the trust level of the
// rest of this internal surface.
exports.createInternalNotification = asyncHandler(async (req, res) => {
    const body = req.body || {}
    const notificationTitle = parseNotificationField(body.notificationTitle, 'notificationTitle')
    const notificationBrief = parseNotificationField(body.notificationBrief, 'notificationBrief')
    const notificationCategory = parseNotificationField(body.notificationCategory, 'notificationCategory')
    const notificationTo = parseNotificationField(body.notificationTo, 'notificationTo')
    const notificationBy = parseNotificationField(body.notificationBy, 'notificationBy')

    const created = await notificationUseCase.createInternalNotification({
        notificationTitle, notificationBrief, notificationCategory, notificationTo, notificationBy,
    })
    return ok(res, { id: created?.id ?? null })
})

exports.grantCardMembership = asyncHandler(async (req, res) => {
    const corporateUserId = sessionCorporateId(req)
    const userId = parseRequiredId(req.body?.userId, 'userId')

    const granted = await grantCardMembership({ userId, corporateUserId })
    if (!granted.ok) throw new ErrorResponse('Employee not found.', 404)

    return ok(res, { userId: granted.userId, alreadyHeld: granted.alreadyHeld })
})

exports.getServiceOperatorByAccessKey = asyncHandler(async (req, res) => {
    const { accessKey } = req.params
    if (!ALLOWED_ACCESS_KEYS.includes(accessKey)) throw new ErrorResponse('Forbidden', 403)
    const serviceOperator = await internalSharedData.findServiceOperatorFullVendor(accessKey)
    return ok(res, { serviceOperator: serviceOperator || null })
})

exports.resolveEntitlement = asyncHandler(async (req, res) => {
    // Identity comes from the gateway-verified session — a caller can only resolve its OWN entitlement.
    const credentialId = parseRequiredId(req.user?.id, 'session credentialId')
    const corporateUserId = sessionCorporateId(req)
    const { accessKey } = req.body || {}
    if (!ALLOWED_ACCESS_KEYS.includes(accessKey)) throw new ErrorResponse('Forbidden', 403)

    const details = await internalSharedData.resolveEntitlement({ credentialId, accessKey, corporateUserId })
    return ok(res, { details })
})

// ---- System-user tree (/system_user/:userId/others/internal) — cross-corporate admin directory ----

// Unscoped member-identity batch for admin screens (the corporate-tree batch is session-scoped).
exports.batchSubCorporatesAdmin = asyncHandler(async (req, res) => {
    const ids = parseIds(req.body?.ids, { max: BATCH_IDS_MAX, field: 'ids' })
    const rows = await internalSharedData.findSubCorporatesByIdsUnscoped(ids)
    return ok(res, { rows })
})

exports.batchCorporates = asyncHandler(async (req, res) => {
    const ids = parseIds(req.body?.ids, { max: BATCH_IDS_MAX, field: 'ids' })
    const rows = await internalSharedData.findCorporatesByIds(ids)
    return ok(res, { rows })
})

exports.searchCorporateIds = asyncHandler(async (req, res) => {
    const searchText = parseSearchText(req.query.companyName)
    const limit = parseLimit(req.query.limit, { fallback: SEARCH_IDS_MAX, max: SEARCH_IDS_MAX })
    const result = await internalSharedData.searchCorporateIdsByCompanyName({ searchText, limit })
    return ok(res, result)
})

exports.pickableSearch = asyncHandler(async (req, res) => {
    const searchText = typeof req.body?.searchText === 'string' && req.body.searchText.trim()
        ? req.body.searchText.trim()
        : undefined
    const limit = parseLimit(req.body?.limit, { fallback: 20, max: PICKABLE_LIMIT_MAX })
    const offset = parseOffset(req.body?.offset)
    const rows = await internalSharedData.searchPickableCorporates({ searchText, excludeIds: [], limit, offset })
    return ok(res, { rows })
})

// A corporate's card members for the admin Corporate Card Lookup. The admin session carries no corporate, so
// the corporate comes from the query — safe only because this tree is SYSTEM_USER-gated.
exports.listCorporateCardUsers = asyncHandler(async (req, res) => {
    const corporateId = parseRequiredId(req.query.corporateId, 'corporateId')
    const serviceLabel = parseServiceLabel(req.query.serviceLabel)
    const limit = parseLimit(req.query.limit, { fallback: 10, max: SEARCH_IDS_MAX })
    const offset = parseOffset(req.query.offset)
    const includeOwner = parseBoolParam(req.query.includeOwner, 'includeOwner')

    const { count, rows } = await internalSharedData.findAndCountCardUsers({
        corporateId, serviceLabel, includeOwner, limit, offset,
    })
    return ok(res, { count, rows })
})

exports.batchCorporateCardUsers = asyncHandler(async (req, res) => {
    const corporateId = parseRequiredId(req.query.corporateId, 'corporateId')
    const serviceLabel = parseServiceLabel(req.query.serviceLabel)
    const ids = req.body?.ids === undefined
        ? []
        : parseIds(req.body.ids, { max: BATCH_IDS_MAX, field: 'ids' })
    if (!ids.length) return ok(res, { rows: [] })

    const rows = await internalSharedData.findCardUsersByIds(ids, corporateId, serviceLabel)
    return ok(res, { rows })
})

exports.pickableCount = asyncHandler(async (req, res) => {
    const count = await internalSharedData.countPickableCorporates()
    return ok(res, { count })
})
