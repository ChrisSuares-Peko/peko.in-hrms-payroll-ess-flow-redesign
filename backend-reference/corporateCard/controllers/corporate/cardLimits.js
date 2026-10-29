const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const { customLog } = require('../../utils/loggerHelper')
const { CARD_STATUS } = require('../../constants/card')
const { GENERIC_ERROR, SELF_ADMIN_DENIED } = require('../../constants/messages')
const {
    LIMIT_FREQUENCY,
    FREQUENCY_OPTIONS,
    AUDIT_ACTION,
    AUDIT_CATEGORY,
} = require('../../constants/cardLimits')
const { MERCHANT_CATEGORIES, findMerchantCategory } = require('../../constants/merchantCategories')
const {
    findByIdScoped: findCardScoped,
    applyLimit,
} = require('../../models/use-cases/cardIssuance')
const { findByCard, findAllByCard } = require('../../models/use-cases/cardAuditLog')
const { getSpendByCard } = require('../../models/use-cases/cardTransaction')
const { serializeCard } = require('../../utils/serializeCard')
const { parsePaging, MAX_ITEMS_PER_PAGE, toNum, round2, toCsv, actorCredentialId, actorDisplay, isSubAdminSelfTarget, isProtectedOwnerTarget, safeAudit, currentMonthRangeUtc, describeCardSettingsChange, cardholderColumnsOf, rowCardholderIdentity} = require('../../utils/cardHelpers')

const spentForCard = async (corporateId, cardIssuanceId) => {
    const { monthStart, monthEnd } = currentMonthRangeUtc()
    const map = await getSpendByCard({ corporateId, cardIssuanceIds: [String(cardIssuanceId)], monthStart, monthEnd })
    return map.get(String(cardIssuanceId)) || 0
}

const AUDIT_CATEGORY_VALUES = Object.values(AUDIT_CATEGORY)
const parseAuditCategory = (req) => {
    const raw = typeof req.query.category === 'string' ? req.query.category.trim() : ''
    if (!raw || raw.toLowerCase() === 'all' || raw.toLowerCase() === 'all events') return { category: undefined }
    if (!AUDIT_CATEGORY_VALUES.includes(raw)) return { error: 'Invalid audit category.' }
    return { category: raw }
}

const EXPORT_MAX_ROWS = 10000

const MAX_LIMIT = 9999999999.99

exports.setCardLimits = asyncHandler(async (req, res, next) => {
    const corporateId = req.user?.corporateId
    const { cardIssuanceId } = req.params
    const { cardLimit, perTxnLimit, frequency } = req.body || {}

    const limitNum = Number(cardLimit)
    if (!Number.isFinite(limitNum) || limitNum <= 0) {
        return next(new ErrorResponse('A valid card limit is required.', 400))
    }
    if (limitNum > MAX_LIMIT) return next(new ErrorResponse('Card limit is too large.', 400))
    let perTxnNum = null
    if (perTxnLimit !== undefined && perTxnLimit !== null && perTxnLimit !== '') {
        perTxnNum = Number(perTxnLimit)
        if (!Number.isFinite(perTxnNum) || perTxnNum <= 0) {
            return next(new ErrorResponse('A valid per-transaction limit is required.', 400))
        }
        if (perTxnNum > limitNum) {
            return next(new ErrorResponse('Per-transaction limit cannot exceed the card limit.', 400))
        }
    }
    const freq = frequency || LIMIT_FREQUENCY.MONTHLY
    if (!FREQUENCY_OPTIONS.includes(freq)) {
        return next(new ErrorResponse('Invalid limit frequency.', 400))
    }

    const card = await findCardScoped(cardIssuanceId, corporateId)
    if (!card) return next(new ErrorResponse('Card not found.', 404))
    if (isSubAdminSelfTarget(req, rowCardholderIdentity(card))
        || await isProtectedOwnerTarget(req, card.userId)) {
        return next(new ErrorResponse(SELF_ADMIN_DENIED, 403))
    }
    if (card.status !== CARD_STATUS.ISSUED) {
        return next(new ErrorResponse('Limits can only be set on an active card.', 400))
    }

    const oldLimit = toNum(card.cardLimit)
    const newFields = { cardLimit: round2(limitNum), perTxnLimit: perTxnNum === null ? null : round2(perTxnNum), limitFrequency: freq }
    try {
        await applyLimit(cardIssuanceId, newFields, actorCredentialId(req))
    } catch (err) {
        customLog(req?.LogTraceId, 'error', { message: '[CardLimits] Failed to set card limits', cardIssuanceId, error: err?.message }, 'CONSOLE')
        return next(new ErrorResponse(GENERIC_ERROR, 500))
    }

    const auditOld = { cardLimit: oldLimit, perTxnLimit: toNum(card.perTxnLimit), limitFrequency: card.limitFrequency }
    await safeAudit(req?.LogTraceId, {
        corporateId,
        ...cardholderColumnsOf(card),
        cardIssuanceId: card.id,
        action: AUDIT_ACTION.LIMIT_SET,
        category: AUDIT_CATEGORY.LIMITS,
        actorCredentialId: actorCredentialId(req),
        actorDisplay: actorDisplay(req),
        title: 'Card limits updated',
        description: `Card limits updated — ${describeCardSettingsChange(auditOld, newFields)}`,
        oldValue: auditOld,
        newValue: newFields,
    })

    const fresh = await findCardScoped(cardIssuanceId, corporateId)
    const spent = await spentForCard(corporateId, fresh.id)
    return res.status(200).json({ status: true, message: 'Card limits updated.', data: { card: serializeCard(fresh, { spent }) }, responseCode: '000' })
})

exports.setCardControls = asyncHandler(async (req, res, next) => {
    const corporateId = req.user?.corporateId
    const { cardIssuanceId } = req.params
    const { restrictedCategories, atmEnabled } = req.body || {}

    let restricted = null
    if (restrictedCategories !== undefined) {
        if (!Array.isArray(restrictedCategories)) {
            return next(new ErrorResponse('restrictedCategories must be an array.', 400))
        }
        const resolved = restrictedCategories.map((name) => findMerchantCategory(name))
        if (resolved.some((c) => !c)) return next(new ErrorResponse('One or more restricted categories are invalid.', 400))
        restricted = resolved
    }
    const atm = atmEnabled === undefined ? undefined : Boolean(atmEnabled)
    if (restricted === null && atm === undefined) {
        return next(new ErrorResponse('Nothing to update.', 400))
    }

    const card = await findCardScoped(cardIssuanceId, corporateId)
    if (!card) return next(new ErrorResponse('Card not found.', 404))
    if (isSubAdminSelfTarget(req, rowCardholderIdentity(card))
        || await isProtectedOwnerTarget(req, card.userId)) {
        return next(new ErrorResponse(SELF_ADMIN_DENIED, 403))
    }
    if (card.status !== CARD_STATUS.ISSUED) {
        return next(new ErrorResponse('Controls can only be set on an active card.', 400))
    }

    const fields = {}
    if (restricted !== null) fields.restrictedCategories = restricted
    if (atm !== undefined) fields.atmEnabled = atm

    try {
        await applyLimit(cardIssuanceId, fields, actorCredentialId(req))
    } catch (err) {
        customLog(req?.LogTraceId, 'error', { message: '[CardLimits] Failed to set card controls', cardIssuanceId, error: err?.message }, 'CONSOLE')
        return next(new ErrorResponse(GENERIC_ERROR, 500))
    }

    const auditOld = { restrictedCategories: card.restrictedCategories || [], atmEnabled: !!card.atmEnabled }
    const auditNew = {
        restrictedCategories: fields.restrictedCategories ?? card.restrictedCategories ?? [],
        atmEnabled: fields.atmEnabled ?? !!card.atmEnabled,
    }
    await safeAudit(req?.LogTraceId, {
        corporateId,
        ...cardholderColumnsOf(card),
        cardIssuanceId: card.id,
        action: AUDIT_ACTION.CONTROLS_UPDATED,
        category: AUDIT_CATEGORY.CONTROLS,
        actorCredentialId: actorCredentialId(req),
        actorDisplay: actorDisplay(req),
        title: 'Card controls updated',
        description: `Card controls updated — ${describeCardSettingsChange(auditOld, auditNew)}`,
        oldValue: auditOld,
        newValue: auditNew,
    })

    const fresh = await findCardScoped(cardIssuanceId, corporateId)
    const spent = await spentForCard(corporateId, fresh.id)
    return res.status(200).json({ status: true, message: 'Card controls updated.', data: { card: serializeCard(fresh, { spent }) }, responseCode: '000' })
})

exports.setCardSettings = asyncHandler(async (req, res, next) => {
    const corporateId = req.user?.corporateId
    const { cardIssuanceId } = req.params
    const { cardLimit, perTxnLimit, frequency, restrictedCategories, atmEnabled } = req.body || {}

    const limitNum = Number(cardLimit)
    if (!Number.isFinite(limitNum) || limitNum <= 0) return next(new ErrorResponse('A valid card limit is required.', 400))
    if (limitNum > MAX_LIMIT) return next(new ErrorResponse('Card limit is too large.', 400))

    let perTxnNum = null
    if (perTxnLimit !== undefined && perTxnLimit !== null && perTxnLimit !== '') {
        perTxnNum = Number(perTxnLimit)
        if (!Number.isFinite(perTxnNum) || perTxnNum <= 0) return next(new ErrorResponse('A valid per-transaction limit is required.', 400))
        if (perTxnNum > limitNum) return next(new ErrorResponse('Per-transaction limit cannot exceed the card limit.', 400))
    }

    const freq = frequency || LIMIT_FREQUENCY.MONTHLY
    if (!FREQUENCY_OPTIONS.includes(freq)) return next(new ErrorResponse('Invalid limit frequency.', 400))

    let restricted = null
    if (restrictedCategories !== undefined) {
        if (!Array.isArray(restrictedCategories)) return next(new ErrorResponse('restrictedCategories must be an array.', 400))
        const resolved = restrictedCategories.map((name) => findMerchantCategory(name))
        if (resolved.some((c) => !c)) return next(new ErrorResponse('One or more restricted categories are invalid.', 400))
        restricted = resolved
    }
    const atm = atmEnabled === undefined ? undefined : Boolean(atmEnabled)

    const card = await findCardScoped(cardIssuanceId, corporateId)
    if (!card) return next(new ErrorResponse('Card not found.', 404))
    if (isSubAdminSelfTarget(req, rowCardholderIdentity(card))
        || await isProtectedOwnerTarget(req, card.userId)) {
        return next(new ErrorResponse(SELF_ADMIN_DENIED, 403))
    }
    if (card.status !== CARD_STATUS.ISSUED) {
        return next(new ErrorResponse('Settings can only be changed on an active card.', 400))
    }

    const oldLimit = toNum(card.cardLimit)
    const fields = {
        cardLimit: round2(limitNum),
        perTxnLimit: perTxnNum === null ? null : round2(perTxnNum),
        limitFrequency: freq,
    }
    if (restricted !== null) fields.restrictedCategories = restricted
    if (atm !== undefined) fields.atmEnabled = atm

    try {
        await applyLimit(cardIssuanceId, fields, actorCredentialId(req))
    } catch (err) {
        customLog(req?.LogTraceId, 'error', { message: '[CardLimits] Failed to save card settings', cardIssuanceId, error: err?.message }, 'CONSOLE')
        return next(new ErrorResponse(GENERIC_ERROR, 500))
    }

    const auditOld = {
        cardLimit: oldLimit,
        perTxnLimit: toNum(card.perTxnLimit),
        limitFrequency: card.limitFrequency,
        restrictedCategories: card.restrictedCategories || [],
        atmEnabled: !!card.atmEnabled,
    }
    const auditNew = {
        cardLimit: fields.cardLimit,
        perTxnLimit: fields.perTxnLimit,
        limitFrequency: fields.limitFrequency,
        restrictedCategories: fields.restrictedCategories ?? card.restrictedCategories ?? [],
        atmEnabled: fields.atmEnabled ?? !!card.atmEnabled,
    }

    const limitsDescription = describeCardSettingsChange(
        { cardLimit: auditOld.cardLimit, perTxnLimit: auditOld.perTxnLimit, limitFrequency: auditOld.limitFrequency },
        { cardLimit: auditNew.cardLimit, perTxnLimit: auditNew.perTxnLimit, limitFrequency: auditNew.limitFrequency }
    )
    const controlsDescription = describeCardSettingsChange(
        { restrictedCategories: auditOld.restrictedCategories, atmEnabled: auditOld.atmEnabled },
        { restrictedCategories: auditNew.restrictedCategories, atmEnabled: auditNew.atmEnabled }
    )
    const NO_CHANGES = 'No changes to limits or controls'
    const limitsChanged = limitsDescription !== NO_CHANGES
    const controlsChanged = controlsDescription !== NO_CHANGES

    const baseAuditFields = {
        corporateId,
        ...cardholderColumnsOf(card),
        cardIssuanceId: card.id,
        action: AUDIT_ACTION.SETTINGS_UPDATED,
        actorCredentialId: actorCredentialId(req),
        actorDisplay: actorDisplay(req),
        title: 'Card settings updated',
        oldValue: auditOld,
        newValue: auditNew,
    }

    if (limitsChanged) {
        await safeAudit(req?.LogTraceId, {
            ...baseAuditFields,
            category: AUDIT_CATEGORY.LIMITS,
            description: `Limits & controls updated — ${limitsDescription}`,
        })
    }
    if (controlsChanged) {
        await safeAudit(req?.LogTraceId, {
            ...baseAuditFields,
            category: AUDIT_CATEGORY.CONTROLS,
            description: `Limits & controls updated — ${controlsDescription}`,
        })
    }
    if (!limitsChanged && !controlsChanged) {
        await safeAudit(req?.LogTraceId, {
            ...baseAuditFields,
            category: AUDIT_CATEGORY.LIMITS,
            description: `Limits & controls updated — ${NO_CHANGES}`,
        })
    }

    const fresh = await findCardScoped(cardIssuanceId, corporateId)
    const spent = await spentForCard(corporateId, fresh.id)
    return res.status(200).json({ status: true, message: 'Card settings updated.', data: { card: serializeCard(fresh, { spent }) }, responseCode: '000' })
})

exports.getMerchantCategories = asyncHandler(async (req, res) => res.status(200).json({
    status: true,
    message: 'Merchant categories fetched.',
    data: { categories: MERCHANT_CATEGORIES },
    responseCode: '000',
}))

exports.getCardAudit = asyncHandler(async (req, res, next) => {
    const corporateId = req.user?.corporateId
    const { cardIssuanceId } = req.params
    const card = await findCardScoped(cardIssuanceId, corporateId)
    if (!card) return next(new ErrorResponse('Card not found.', 404))

    const { category, error } = parseAuditCategory(req)
    if (error) return next(new ErrorResponse(error, 400))
    const { limit, offset } = parsePaging(req, MAX_ITEMS_PER_PAGE)
    const { count, rows } = await findByCard({ cardIssuanceId, category, limit, offset })
    const data = rows.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        timestamp: r.createdAt,
        actor: r.actorDisplay,
        category: r.category,
        action: r.action,
    }))
    return res.status(200).json({ status: true, message: 'Audit trail fetched.', data: { count, rows: data }, responseCode: '000' })
})

exports.exportCardAudit = asyncHandler(async (req, res, next) => {
    const corporateId = req.user?.corporateId
    const { cardIssuanceId } = req.params
    const card = await findCardScoped(cardIssuanceId, corporateId)
    if (!card) return next(new ErrorResponse('Card not found.', 404))

    const { category, error } = parseAuditCategory(req)
    if (error) return next(new ErrorResponse(error, 400))

    const rows = await findAllByCard({ cardIssuanceId, category, limit: EXPORT_MAX_ROWS })

    const header = ['Date', 'Action', 'Description', 'Actor', 'Category']
    const body = rows.map((r) => [
        r.createdAt ? new Date(r.createdAt).toISOString() : '',
        r.title || r.action,
        r.description || '',
        r.actorDisplay || '',
        r.category || '',
    ])
    const csv = String.fromCharCode(0xfeff) + toCsv(header, body)

    const suffix = category ? category.toLowerCase() : 'all'
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="card-audit-${cardIssuanceId}-${suffix}.csv"`)
    return res.status(200).send(csv)
})
