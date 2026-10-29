const { decrypt } = require('./cardCrypto')
const { customLog } = require('./loggerHelper')
const { writeAudit } = require('../models/use-cases/cardAuditLog')
const { findCardholderById } = require('../models/use-cases/cardUser')
const { getCardholdersByIdentities, getCorporateCardUsersByIds, findOwnerCardholder } = require('./sharedDirectory')
const {
    membershipRole,
    cardholderIdentity,
    rowCardholderIdentity,
    cardholderWhere,
    rowBelongsToCardholder,
    cardholderColumnsOf,
    cardholderColumnsForSession,
    cardholderColumnsOfDirectoryRow,
    cardholderProfile,
} = require('./cardholderIdentity')
const { LIMIT_FREQUENCY } = require('../constants/cardLimits')
const { resolveRoleName, actsAsCorporateAdmin, ROLE_NAMES } = require('./cardRoles')
const { TRANSACTION_MODE } = require('../constants/jit')
const MAX_ITEMS_PER_PAGE = 100
const parsePaging = (req, defaultSize = 10) => {
    let page = parseInt(req.query.page, 10)
    let itemsPerPage = parseInt(req.query.itemsPerPage, 10)
    if (!Number.isFinite(page) || page < 1) page = 1
    if (!Number.isFinite(itemsPerPage) || itemsPerPage < 1) itemsPerPage = defaultSize
    if (itemsPerPage > MAX_ITEMS_PER_PAGE) itemsPerPage = MAX_ITEMS_PER_PAGE
    return { limit: itemsPerPage, offset: (page - 1) * itemsPerPage }
}
const MOBILE_REGEX = /^\d{10}$/
const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000
const monthRangeUtc = (month) => {
    const [year, mon] = month.split('-').map(Number)
    const monthStart = new Date(`${month}-01T00:00:00.000+05:30`)
    const nextYear = mon === 12 ? year + 1 : year
    const nextMon = mon === 12 ? 1 : mon + 1
    const monthEnd = new Date(`${nextYear}-${String(nextMon).padStart(2, '0')}-01T00:00:00.000+05:30`)
    return { monthStart, monthEnd }
}
const currentMonthString = () => new Date(Date.now() + IST_OFFSET_MS).toISOString().slice(0, 7)
const currentMonthRangeUtc = () => monthRangeUtc(currentMonthString())
const limitWindowRangeUtc = (frequency, now = new Date()) => {
    if (frequency === LIMIT_FREQUENCY.DAILY) {
        const windowStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
        const windowEnd = new Date(windowStart)
        windowEnd.setUTCDate(windowEnd.getUTCDate() + 1)
        return { windowStart, windowEnd }
    }
    if (frequency === LIMIT_FREQUENCY.WEEKLY) {
        const daysSinceMonday = (now.getUTCDay() + 6) % 7
        const windowStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysSinceMonday))
        const windowEnd = new Date(windowStart)
        windowEnd.setUTCDate(windowEnd.getUTCDate() + 7)
        return { windowStart, windowEnd }
    }
    const { monthStart, monthEnd } = monthRangeUtc(new Date(now.getTime() + IST_OFFSET_MS).toISOString().slice(0, 7))
    return { windowStart: monthStart, windowEnd: monthEnd }
}
const isRestrictedCategory = (restrictedCategories, mcc) => {
    if (!Array.isArray(restrictedCategories) || !restrictedCategories.length || !mcc) return false
    const mccStr = String(mcc)
    return restrictedCategories.some((c) => Array.isArray(c?.mccs) && c.mccs.some((m) => String(m) === mccStr))
}
const isAtmTransaction = (transactionMode) => Number(transactionMode) === TRANSACTION_MODE.ATM
const toNum = (v) => (v === null || v === undefined ? null : Number(v))
const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100
const fmt = (n) => (n === null || n === undefined ? '0' : Number(n).toLocaleString('en-IN'))
const last4 = (masked) => (masked ? String(masked).slice(-4) : null)
const DEFAULT_MAX_EMAIL_MB = 20
const parseVendorMaxEmailMb = (optionals) => {
    const mb = Number(optionals?.maxEmailSizeMb)
    return Number.isFinite(mb) && mb > 0 ? mb : DEFAULT_MAX_EMAIL_MB
}
const parseVendorEmail = (raw) => {
    if (Array.isArray(raw)) return raw.filter((e) => e && String(e).trim()).map((e) => String(e).trim())
    if (typeof raw !== 'string' || !raw.trim()) return null
    const s = raw.trim()
    if (s.startsWith('[')) {
        try {
            const arr = JSON.parse(s)
            return Array.isArray(arr) ? arr.filter((e) => e && String(e).trim()).map((e) => String(e).trim()) : null
        } catch (err) {
            return null
        }
    }
    return s.split(/[,;\s]+/).filter(Boolean)
}
const rupees = (v) => `₹${fmt(v)}`
const restrictedCategoryNames = (list) =>
    (Array.isArray(list) ? list.map((c) => (typeof c === 'string' ? c : c?.category)).filter(Boolean) : [])
const describeCardSettingsChange = (oldValue = {}, newValue = {}) => {
    const parts = []
    const has = (key) => key in oldValue && key in newValue
    if (has('cardLimit') && toNum(oldValue.cardLimit) !== toNum(newValue.cardLimit)) {
        parts.push(`card limit ${rupees(toNum(oldValue.cardLimit))} → ${rupees(toNum(newValue.cardLimit))}`)
    }
    if (has('perTxnLimit')) {
        const o = toNum(oldValue.perTxnLimit)
        const n = toNum(newValue.perTxnLimit)
        if (o !== n) {
            if (n === null) parts.push('per-transaction limit removed')
            else if (o === null) parts.push(`per-transaction limit set to ${rupees(n)}`)
            else parts.push(`per-transaction limit ${rupees(o)} → ${rupees(n)}`)
        }
    }
    if (has('limitFrequency')) {
        const o = oldValue.limitFrequency || LIMIT_FREQUENCY.MONTHLY
        const n = newValue.limitFrequency || LIMIT_FREQUENCY.MONTHLY
        if (o !== n) parts.push(`limit frequency ${o} → ${n}`)
    }
    if (has('atmEnabled') && Boolean(oldValue.atmEnabled) !== Boolean(newValue.atmEnabled)) {
        parts.push(`ATM withdrawals ${newValue.atmEnabled ? 'enabled' : 'disabled'}`)
    }
    if (has('restrictedCategories')) {
        const before = restrictedCategoryNames(oldValue.restrictedCategories)
        const after = restrictedCategoryNames(newValue.restrictedCategories)
        const added = after.filter((c) => !before.includes(c))
        const removed = before.filter((c) => !after.includes(c))
        if (added.length) parts.push(`restricted categories added: ${added.join(', ')}`)
        if (removed.length) parts.push(`restricted categories removed: ${removed.join(', ')}`)
    }
    if (!parts.length) return 'No changes to limits or controls'
    const summary = parts.join('; ')
    return summary.charAt(0).toUpperCase() + summary.slice(1)
}
// LIKE metacharacters in a user's search term. Without this a typed `%` matches every row and `_`
// matches any character, so the list silently widens instead of narrowing.
const escapeLike = (s) => String(s).replace(/[\\%_]/g, '\\$&')
const csvEscape = (v) => {
    if (v === null || v === undefined) return ''
    const s = String(v)
    return /["\r\n,]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
const toCsv = (header, rows) => [header, ...rows].map((cols) => cols.map(csvEscape).join(',')).join('\r\n')
const escapeHtml = (v) => {
    if (v === null || v === undefined) return ''
    return String(v)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}
// CORPORATE_SUB_USER belongs here: a sub-corporate session is minted with that role on the blob, which is
// what every other service keys on. Omitting it refused them at the role gate before any permission was
// consulted, so a member granted this service in User Management got 403 on every route.
const CARD_SESSION_ROLES = new Set(['CORPORATE', 'CORPORATE_SUB_USER', 'USER'])
const CORPORATE_SESSION_ROLES = new Set(['CORPORATE', 'CORPORATE_SUB_USER'])
const assignedRoleName = (req) => {
    if (CORPORATE_SESSION_ROLES.has(req.user?.role)) return ROLE_NAMES.ADMIN
    return resolveRoleName(membershipRole(req))
}
/**
 * The role a session is ACTING in, as opposed to the one it was assigned.
 *
 * An employee whose card role is Admin can switch down to Employee to work with their own card
 * (POST users/active-role). CLAMPED to the assigned role, so the mode may only ever REDUCE authority and a
 * tampered `activeSubRole` can never promote anyone — the server-side check in users/controllers/switchRole.js
 * refuses the switch, and this refuses to honour one that somehow reached the blob anyway.
 *
 * The account holder has no mode: their Corporate account IS the admin view, so nothing they carry here is
 * read.
 */
const activeRoleName = (req) => {
    const assigned = assignedRoleName(req)
    if (assigned !== ROLE_NAMES.ADMIN) return assigned
    if (req.user?.role !== 'USER') return assigned
    return resolveRoleName(req.user?.activeSubRole ?? assigned)
}
const isCorporateAdmin = (req) => {
    const role = req.user?.role
    if (!CARD_SESSION_ROLES.has(role)) return false
    // An employee holds card authority only through a live membership AND an identity to exercise it as. One
    // granted another service must never resolve to Admin on the strength of that service's role field.
    if (role === 'USER' && !cardholderIdentity(req)) return false
    return actsAsCorporateAdmin(activeRoleName(req))
}
const isCardholderSession = (req) => !!cardholderIdentity(req)
/**
 * The ACCOUNT HOLDER, not merely a session presenting as one.
 *
 * A sub-corporate login swaps the credential for the parent corporate's, so its session also carries
 * role 'CORPORATE' and was indistinguishable from the owner here — which handed it the owner's standing
 * for every check built on this, `isProtectedOwnerTarget` among them. The member's own id is what tells
 * the two apart.
 */
const isCorporateOwner = (req) => req.user?.role === 'CORPORATE' && !req.user?.subCorporateId
const actsAsOwner = (req) => isCorporateOwner(req) && isCorporateAdmin(req)
/**
 * Whether an admin who is themselves a cardholder is aiming at their OWN row.
 *
 * Without this an admin could issue and manage their own card. A plain id argument is accepted alongside an
 * identity, which is what every caller holding a row's `userId` means.
 */
const isSubAdminSelfTarget = (req, target) => {
    if (isCorporateOwner(req) || !isCorporateAdmin(req)) return false
    if (target === null || target === undefined) return false
    const self = cardholderIdentity(req)
    if (!self) return false
    const targetIdentity = (typeof target === 'object') ? { userId: target.userId ?? null } : { userId: target }
    return rowBelongsToCardholder(targetIdentity, self)
}
const isProtectedOwnerTarget = async (req, targetUserId) => {
    if (actsAsOwner(req)) return false
    if (targetUserId === null || targetUserId === undefined) return false
    if (!isCorporateAdmin(req)) return false
    if (String(req.user?.employeeProfileId) === String(targetUserId)) return false
    try {
        const owner = await findOwnerCardholder(req)
        if (!owner?.id) return false
        return String(owner.id) === String(targetUserId)
    } catch (err) {
        return true
    }
}
// Every cardholder logs in as themselves, so `req.user.id` is already their own credential.
const actorCredentialId = (req) => req.user?.id ?? null
const actorUsername = (req) => req.user?.username ?? null
/**
 * Who a request may see, as a corporate plus an optional cardholder identity.
 *
 * `cardholder: undefined` means an admin asking for the whole corporate — it is the only case where no
 * cardholder predicate is correct, and a caller must never reach it by finding a field missing.
 */
const resolveScope = (req) => {
    const corporateId = req.user?.corporateId
    if (!corporateId) return { error: 'Corporate context is missing.' }
    if (isCorporateAdmin(req)) {
        const userId = typeof req.query.userId === 'string' ? req.query.userId : undefined
        if (userId) return { corporateId, cardholder: { userId } }
        return { corporateId, cardholder: undefined }
    }
    const cardholder = cardholderIdentity(req)
    if (!cardholder) return { error: 'Cardholder context is missing.' }
    return { corporateId, cardholder }
}
const isAdmin = isCorporateAdmin
const adminActor = (req) => `${req.user?.contactPersonName || req.user?.name || req.user?.employeeName || 'Admin'} (Admin)`
const cardholderActor = (req) => `${(cardholderProfile(req).name || 'Cardholder').trim()} (Cardholder)`
const actorDisplay = (req) => {
    if (!isCardholderSession(req)) return adminActor(req)
    const name = (cardholderProfile(req).name || 'Member').trim()
    return `${name} (${isCorporateAdmin(req) ? 'Admin' : 'Cardholder'})`
}
const ROLE = { ADMIN: 'ADMIN', CARDHOLDER: 'CARDHOLDER' }
const resolveActingIdentity = async (req, transaction, requestedRole) => {
    const role = typeof requestedRole === 'string' ? requestedRole.trim().toUpperCase() : undefined
    if (!isAdmin(req)) {
        if (role && role !== ROLE.CARDHOLDER) {
            return { error: `A cardholder can only act as ${ROLE.CARDHOLDER}.`, statusCode: 403 }
        }
        const self = cardholderProfile(req)
        return {
            role: ROLE.CARDHOLDER,
            userId: self.id,
            name: self.name,
            email: self.email,
        }
    }
    const effectiveRole = role || ROLE.ADMIN
    if (effectiveRole === ROLE.ADMIN) {
        if (isCardholderSession(req)) {
            const self = cardholderProfile(req)
            return {
                role: ROLE.ADMIN,
                userId: self.id,
                name: self.name,
                email: self.email,
            }
        }
        return {
            role: ROLE.ADMIN,
            userId: req.user?.corporateId,
            name: req.user?.contactPersonName || req.user?.name || null,
            email: req.user?.email || null,
        }
    }
    if (effectiveRole === ROLE.CARDHOLDER) {
        const cardholder = transaction.userId ? await findCardholderById(transaction.userId, req) : null
        return {
            role: ROLE.CARDHOLDER,
            userId: transaction.userId,
            name: cardholder?.name || null,
            email: cardholder?.email || null,
        }
    }
    return { error: `role must be one of: ${ROLE.ADMIN}, ${ROLE.CARDHOLDER}.`, statusCode: 400 }
}
const vendorResponseCode = (result) => Number(result?.data?.responseCode ?? result?.error?.responseCode)
const safeDecrypt = (value) => {
    try {
        return decrypt(value)
    } catch (err) {
        return null
    }
}
const safeAudit = async (logTraceId, fields) => {
    try {
        await writeAudit(fields)
    } catch (err) {
        customLog(logTraceId, 'error', { message: '[CardAudit] audit write failed (operation still applied)', action: fields?.action, error: err?.message }, 'CONSOLE')
    }
}
const cardholdersAcrossCorporates = async (rows, req) => {
    const idsByCorporate = new Map()
    for (const row of rows) {
        const identity = rowCardholderIdentity(row)
        if (!identity || !row.corporateId) continue
        const key = String(row.corporateId)
        if (!idsByCorporate.has(key)) idsByCorporate.set(key, [])
        idsByCorporate.get(key).push(identity.userId)
    }

    const merged = new Map()
    for (const [corporateId, ids] of idsByCorporate) {
        const found = await getCorporateCardUsersByIds(ids, corporateId, req)
        for (const [id, cardholder] of found) merged.set(id, cardholder)
    }
    return merged
}

const attachCardholders = async (rows, req) => {
    try {
        const cardholders = req.user?.corporateId
            ? await getCardholdersByIdentities(rows.map(rowCardholderIdentity), req)
            : await cardholdersAcrossCorporates(rows, req)
        rows.forEach((row) => {
            const identity = rowCardholderIdentity(row)
            row.cardholder = identity ? cardholders.get(String(identity.userId)) || null : null
        })
    } catch (err) {
        customLog(req?.LogTraceId, 'error', {
            message: '[Internal] cardholder hydration failed — rendering rows without cardholder identity',
            error: err?.message,
        }, 'CONSOLE')
        rows.forEach((row) => { row.cardholder = null })
    }
    return rows
}
module.exports = {
    MAX_ITEMS_PER_PAGE,
    MOBILE_REGEX,
    MONTH_REGEX,
    monthRangeUtc,
    currentMonthString,
    currentMonthRangeUtc,
    limitWindowRangeUtc,
    isRestrictedCategory,
    isAtmTransaction,
    parsePaging,
    toNum,
    round2,
    fmt,
    last4,
    parseVendorEmail,
    parseVendorMaxEmailMb,
    DEFAULT_MAX_EMAIL_MB,
    describeCardSettingsChange,
    csvEscape,
    escapeLike,
    toCsv,
    escapeHtml,
    isAdmin,
    isCorporateAdmin,
    assignedRoleName,
    activeRoleName,
    isCorporateOwner,
    actsAsOwner,
    isProtectedOwnerTarget,
    isCardholderSession,
    cardholderIdentity,
    cardholderColumnsOf,
    cardholderColumnsForSession,
    cardholderColumnsOfDirectoryRow,
    cardholderProfile,
    rowCardholderIdentity,
    cardholderWhere,
    rowBelongsToCardholder,
    isSubAdminSelfTarget,
    actorCredentialId,
    actorUsername,
    resolveScope,
    actorDisplay,
    adminActor,
    cardholderActor,
    ROLE,
    resolveActingIdentity,
    vendorResponseCode,
    safeDecrypt,
    safeAudit,
    attachCardholders,
}
