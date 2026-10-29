const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const { KYB_STATUS } = require('../../constants/corporateCardApplication')
const { CARD_STATUS } = require('../../constants/card')
const { AUDIT_ACTION } = require('../../constants/cardLimits')
const { CARD_REQUEST_TYPE, CARD_REQUEST_STATUS } = require('../../constants/cardRequest')
const { LEDGER_DIRECTION, ENTRY_TYPE_META, TOPUP_HISTORY_TYPES } = require('../../constants/ledger')
const { findByCorporate: findApplication } = require('../../models/use-cases/corporateCardAdminApplication')
const { findCardsByScope, findAndCountPhysicalTracking, sumCardLimits } = require('../../models/use-cases/cardIssuance')
const { findTerminationStatusByCardIds, findAndCountForQueue } = require('../../models/use-cases/cardRequest')
const { findByCorporate: findAuditByCorporate, findLatestByCardsAndAction } = require('../../models/use-cases/cardAuditLog')
const { findForCorporateLookup: findKycForCorporate } = require('../../models/use-cases/cardholderKyc')
const { findAndCountByCorporate: findLedgerByCorporate } = require('../../models/use-cases/corporateCardLedger')
const { listAllTransactions } = require('../../models/use-cases/cardTransaction')
const { walletBalanceParts } = require('../../services/walletBalance')
const { getCorporatesByIds, findAndCountCorporateCardUsers, getCorporateCardUsersByIds } = require('../../utils/sharedDirectory')
const { serializeCard } = require('../../utils/serializeCard')
const { serializeCardTracking } = require('../../utils/serializeCardTracking')
const { parsePaging, last4, toNum, round2 } = require('../../utils/cardHelpers')
const { ROLE_NAMES } = require('../../utils/cardRoles')
const { customLog } = require('../../utils/loggerHelper')

// Every member of one corporate in a single directory call. Corporates are far below this; the response says
// when it was hit so the screen never silently shows a partial list.
const MEMBERS_MAX = 1000

const parseCorporateId = (raw) => {
    const id = Number(raw)
    return Number.isInteger(id) && id > 0 ? id : null
}

const ok = (res, message, data) => res.status(200).json({ status: true, message, data, responseCode: '000' })

// Directory reads are best-effort: an outage in the others MS must degrade the page (names shown as "-"),
// never fail the lookup, since everything else on it is this service's own data.
const bestEffort = async (req, action, fallback, fn) => {
    try {
        return await fn()
    } catch (err) {
        customLog(req?.LogTraceId, 'error', {
            message: '[CorporateCardLookup] directory read failed — rendering without it',
            action: `corporateCard:lookup:${action}`,
            error: err?.message,
        }, 'INTERNAL')
        return fallback
    }
}

// Where the card is in its life, as the lookup reads it. Termination wins over everything; a failed card
// says why when the issuer or the reconciler recorded it.
const activationStatus = (card, terminationStatus) => {
    if (terminationStatus === 'COMPLETED') return 'Terminated'
    if (card.status === CARD_STATUS.FAILED) return 'Failed'
    if (card.status === CARD_STATUS.PENDING) return 'Pending'
    if (card.status === CARD_STATUS.ISSUED) return 'Activated'
    return card.status
}

const deliveryStatus = (row) => {
    if (row.cardType !== 'Physical') return null
    const dispatches = Array.isArray(row.dispatches) ? row.dispatches : []
    if (!dispatches.length) return row.status === CARD_STATUS.FAILED ? null : 'Not dispatched'
    return dispatches.some((d) => d?.receivedAt) ? 'Delivered' : 'In transit'
}

const failureReasonOf = (row, failureAudit) => {
    if (row.status !== CARD_STATUS.FAILED) return null
    if (row.reconcileLastError) return row.reconcileLastError
    if (!failureAudit) return null
    const code = failureAudit.metadata?.responseCode
    return code !== undefined && code !== null
        ? `${failureAudit.description} (issuer code ${code})`
        : failureAudit.description
}

const serializeLookupCard = (row, { terminationStatus, failureAudit }) => {
    const card = serializeCard(row, { terminationStatus })
    const tracking = row.cardType === 'Physical' ? serializeCardTracking(row) : null
    const latestDispatch = tracking?.dispatches?.length ? tracking.dispatches[tracking.dispatches.length - 1] : null
    return {
        id: card.id,
        type: card.type,
        last4: card.last4,
        nameOnCard: card.nameOnCard,
        status: card.status,
        issuanceStatus: card.issuanceStatus,
        activationStatus: activationStatus(row, terminationStatus),
        failureReason: failureReasonOf(row, failureAudit),
        cardState: card.cardState,
        freezeReasonLabel: card.freezeReasonLabel,
        freezeReasonNote: card.freezeReasonNote,
        frozenByRole: card.frozenByRole,
        terminationStatus: card.terminationStatus,
        cardLimit: card.cardLimit,
        perTxnLimit: card.perTxnLimit,
        limitFrequency: card.limitFrequency,
        atmEnabled: card.atmEnabled,
        deliveryStatus: deliveryStatus(row),
        awbNumber: latestDispatch?.awbNumber ?? null,
        courierPartnerName: latestDispatch?.courierPartnerName ?? null,
        issuedOn: card.createdAt,
    }
}

const serializeKyc = (row) => (row
    ? { status: row.kycStatus, reason: row.reason || null, updatedAt: row.updatedAt || null }
    : null)

// Mobile first, then identity — the same order the People screen resolves KYC in, since one person holding
// two identities shares one row keyed by handset.
const kycFor = (member, byMobile, byUserId) =>
    (member.mobileNo && byMobile.get(String(member.mobileNo).trim())) || byUserId.get(String(member.id)) || null

const serializeMember = (member, { cards, kyc, removed = false }) => ({
    id: String(member.id),
    name: member.name || null,
    email: member.email || null,
    mobileNo: member.mobileNo || null,
    // The account holder is an Admin by construction, whatever their membership entry says.
    role: member.isAccountOwner ? ROLE_NAMES.ADMIN : (member.role || ROLE_NAMES.EMPLOYEE),
    status: removed ? 'REMOVED' : (member.status || null),
    isAccountOwner: !!member.isAccountOwner,
    addedOn: member.createdAt || null,
    kyc: serializeKyc(kyc),
    cards,
})

const serializeKyb = (application) => ({
    status: application.kybStatus || KYB_STATUS.PENDING,
    kybReference: application.kybReference || null,
    rejectionReason: application.metadata?.rejectionReason || null,
    businessType: application.businessType || null,
    updatedAt: application.updatedAt,
})

const countBy = (items, pick) => items.reduce((acc, item) => {
    const key = pick(item)
    if (key) acc[key] = (acc[key] || 0) + 1
    return acc
}, {})

exports.getCorporateLookup = asyncHandler(async (req, res, next) => {
    const corporateId = parseCorporateId(req.params.corporateId)
    if (!corporateId) return next(new ErrorResponse('A valid corporate is required.', 400))

    const application = await findApplication(corporateId)
    if (!application) return next(new ErrorResponse('This corporate has not applied for Corporate Cards.', 404))

    // The section tables page themselves; these one-row reads only give each stat tile its total.
    const COUNT_ONLY = { limit: 1, offset: 0 }
    const [corporates, memberPage, cardRows, walletParts, limits, activityPage, requestPage, topUpPage, transactionPage] = await Promise.all([
        bestEffort(req, 'corporate', new Map(), () => getCorporatesByIds([corporateId], req)),
        bestEffort(req, 'members', null, () =>
            findAndCountCorporateCardUsers({ corporateId, includeOwner: true, limit: MEMBERS_MAX, offset: 0, req })),
        findCardsByScope({ corporateId }),
        walletBalanceParts({ corporateId }),
        sumCardLimits({ corporateId }),
        findAuditByCorporate({ corporateId, ...COUNT_ONLY }),
        findAndCountForQueue({ corporateId, ...COUNT_ONLY }),
        findLedgerByCorporate({ corporateId, direction: LEDGER_DIRECTION.IN, entryTypes: TOPUP_HISTORY_TYPES, ...COUNT_ONLY }),
        listAllTransactions({ corporateId, ...COUNT_ONLY }),
    ])
    const corporate = corporates.get(String(corporateId)) || null
    const members = memberPage?.rows || []

    const cardIds = cardRows.map((c) => c.id)
    const failedIds = cardRows.filter((c) => c.status === CARD_STATUS.FAILED).map((c) => c.id)
    const [terminationByCard, failureAuditByCard] = await Promise.all([
        findTerminationStatusByCardIds(cardIds),
        findLatestByCardsAndAction({ cardIssuanceIds: failedIds, action: AUDIT_ACTION.CARD_ISSUE_FAILED }),
    ])

    // Cards held by people no longer on the member list (removed employees) still belong on the page.
    const memberIds = new Set(members.map((m) => String(m.id)))
    const orphanHolderIds = [...new Set(cardRows.map((c) => c.userId).filter((id) => id && !memberIds.has(String(id))).map(String))]
    const removedMembers = orphanHolderIds.length
        ? await bestEffort(req, 'removedMembers', new Map(), () => getCorporateCardUsersByIds(orphanHolderIds, corporateId, req))
        : new Map()

    const kycRows = await findKycForCorporate({
        corporateId,
        mobileNumbers: [...members, ...removedMembers.values()].map((m) => m.mobileNo),
    })
    const kycByMobile = new Map(kycRows.map((k) => [String(k.mobileNumber).trim(), k]))
    const kycByUserId = new Map(kycRows.filter((k) => k.userId).map((k) => [String(k.userId), k]))

    const cardsByHolder = new Map()
    const unassignedCards = []
    cardRows.forEach((row) => {
        const card = serializeLookupCard(row, {
            terminationStatus: terminationByCard.get(String(row.id)) || null,
            failureAudit: failureAuditByCard.get(String(row.id)) || null,
        })
        if (!row.userId) return unassignedCards.push(card)
        const key = String(row.userId)
        if (!cardsByHolder.has(key)) cardsByHolder.set(key, [])
        cardsByHolder.get(key).push(card)
    })

    const people = [
        ...members.map((m) => serializeMember(m, {
            cards: cardsByHolder.get(String(m.id)) || [],
            kyc: kycFor(m, kycByMobile, kycByUserId),
        })),
        ...orphanHolderIds.map((id) => serializeMember(removedMembers.get(id) || { id }, {
            cards: cardsByHolder.get(id) || [],
            kyc: removedMembers.get(id) ? kycFor(removedMembers.get(id), kycByMobile, kycByUserId) : kycByUserId.get(id),
            removed: true,
        })),
    ]
    const allCards = [...people.flatMap((p) => p.cards), ...unassignedCards]
    // A card counts once the issuer has activated it — frozen and terminated cards included, since they were
    // live once. Pending and failed attempts never became cards, so they are reported beside the count.
    const activatedCards = allCards.filter((c) => c.issuanceStatus === CARD_STATUS.ISSUED)

    return ok(res, 'Corporate card lookup fetched.', {
        profile: {
            corporateId,
            companyName: corporate?.companyName || corporate?.credential?.name || null,
            contactPersonName: corporate?.contactPersonName || null,
            accountId: corporate?.credential?.username || null,
            email: corporate?.email || null,
            phone: corporate?.mobileNo || null,
            appliedOn: application.createdAt,
        },
        kyb: serializeKyb(application),
        wallet: {
            balance: walletParts.balance,
            totalCredited: round2(walletParts.ledger.in),
            totalSpent: round2(walletParts.spendTotal),
            totalCardLimits: round2(limits.total),
            svcCardNumberLast4: application.svcCardNumber ? last4(application.svcCardNumber) : null,
        },
        stats: {
            admins: people.filter((p) => p.role === ROLE_NAMES.ADMIN && p.status !== 'REMOVED').length,
            employees: people.filter((p) => p.role !== ROLE_NAMES.ADMIN && p.status !== 'REMOVED').length,
            cards: activatedCards.length,
            cardsByType: countBy(activatedCards, (c) => c.type),
            cardsByActivation: countBy(allCards, (c) => c.activationStatus),
            frozenCards: activatedCards.filter((c) => c.status === 'Frozen').length,
            pendingCards: allCards.filter((c) => c.issuanceStatus === CARD_STATUS.PENDING).length,
            failedCards: allCards.filter((c) => c.issuanceStatus === CARD_STATUS.FAILED).length,
            kycByStatus: countBy(people.filter((p) => p.status !== 'REMOVED'), (p) => p.kyc?.status || 'NOT_STARTED'),
            activityCount: activityPage.count,
            requestCount: requestPage.count,
            topUpCount: topUpPage.count,
            transactionCount: transactionPage.count,
        },
        members: people,
        membersUnavailable: memberPage === null,
        membersCapped: !!memberPage && memberPage.count > members.length,
        unassignedCards,
    })
})

// Everything recorded against the corporate's cards: issuance, freeze/unfreeze (and failed attempts), limit
// changes, dispatch, termination. Failure reasons live in the description.
exports.listLookupActivity = asyncHandler(async (req, res, next) => {
    const corporateId = parseCorporateId(req.params.corporateId)
    if (!corporateId) return next(new ErrorResponse('A valid corporate is required.', 400))
    const category = typeof req.query.category === 'string' && req.query.category.trim() ? req.query.category.trim() : undefined
    const { limit, offset } = parsePaging(req)

    const { count, rows } = await findAuditByCorporate({ corporateId, category, limit, offset })
    const plain = rows.map((r) => (r.get ? r.get({ plain: true }) : r))
    const holderIds = [...new Set(plain.map((r) => r.userId).filter(Boolean).map(String))]
    const holders = holderIds.length
        ? await bestEffort(req, 'activityHolders', new Map(), () => getCorporateCardUsersByIds(holderIds, corporateId, req))
        : new Map()

    return ok(res, 'Activity fetched.', {
        count,
        rows: plain.map((r) => ({
            id: String(r.id),
            action: r.action,
            category: r.category || null,
            title: r.title || null,
            description: r.description || null,
            isFailure: /FAILED|BLOCKED|REJECTED/.test(r.action || ''),
            actor: r.actorDisplay || null,
            cardholderName: r.userId ? holders.get(String(r.userId))?.name || null : null,
            cardIssuanceId: r.cardIssuanceId ? String(r.cardIssuanceId) : null,
            responseCode: r.metadata?.responseCode ?? null,
            createdAt: r.createdAt,
        })),
    })
})

const REQUEST_TYPES = Object.values(CARD_REQUEST_TYPE)
const REQUEST_STATUSES = Object.values(CARD_REQUEST_STATUS)

// Requests raised on the platform (card issuance, limit increase, unfreeze, termination) and how each ended —
// the decision note carries the reason a request was rejected.
exports.listLookupRequests = asyncHandler(async (req, res, next) => {
    const corporateId = parseCorporateId(req.params.corporateId)
    if (!corporateId) return next(new ErrorResponse('A valid corporate is required.', 400))
    const requestType = typeof req.query.requestType === 'string' ? req.query.requestType.trim().toUpperCase() : ''
    if (requestType && !REQUEST_TYPES.includes(requestType)) return next(new ErrorResponse('Invalid request type filter.', 400))
    const status = typeof req.query.status === 'string' ? req.query.status.trim().toUpperCase() : ''
    if (status && !REQUEST_STATUSES.includes(status)) return next(new ErrorResponse('Invalid status filter.', 400))
    const { limit, offset } = parsePaging(req)

    const { count, rows } = await findAndCountForQueue({
        corporateId, requestType: requestType || undefined, status: status || undefined, limit, offset,
    })
    const holderIds = [...new Set(rows.map((r) => r.userId).filter(Boolean).map(String))]
    const holders = holderIds.length
        ? await bestEffort(req, 'requestHolders', new Map(), () => getCorporateCardUsersByIds(holderIds, corporateId, req))
        : new Map()

    return ok(res, 'Requests fetched.', {
        count,
        rows: rows.map((r) => ({
            id: String(r.id),
            requestType: r.requestType,
            cardType: r.cardType || null,
            status: r.status,
            reason: r.reason || null,
            decisionNote: r.decisionNote || null,
            cardholderName: r.userId ? holders.get(String(r.userId))?.name || null : null,
            cardLast4: last4(r.card?.maskedCardNumber),
            requestedAmount: toNum(r.payload?.requestedAmount ?? r.payload?.requestedLimit),
            decidedAt: r.decidedAt || null,
            createdAt: r.createdAt,
        })),
    })
})

exports.listLookupTopUps = asyncHandler(async (req, res, next) => {
    const corporateId = parseCorporateId(req.params.corporateId)
    if (!corporateId) return next(new ErrorResponse('A valid corporate is required.', 400))
    const { limit, offset } = parsePaging(req)

    const { count, rows } = await findLedgerByCorporate({
        corporateId,
        direction: LEDGER_DIRECTION.IN,
        entryTypes: TOPUP_HISTORY_TYPES,
        limit,
        offset,
    })
    return ok(res, 'Wallet top-ups fetched.', {
        count,
        rows: rows.map((r) => ({
            id: String(r.id),
            date: r.occurredAt,
            entryType: r.entryType,
            method: ENTRY_TYPE_META[r.entryType]?.label || r.entryType,
            reference: r.reference || null,
            description: r.description || null,
            // Only reloads the issuer confirmed are ever written to the ledger.
            status: 'Completed',
            amount: toNum(r.amount) ?? 0,
        })),
    })
})

exports.listLookupDispatches = asyncHandler(async (req, res, next) => {
    const corporateId = parseCorporateId(req.params.corporateId)
    if (!corporateId) return next(new ErrorResponse('A valid corporate is required.', 400))
    const { limit, offset } = parsePaging(req)

    const { count, rows } = await findAndCountPhysicalTracking({ corporateId, limit, offset })
    const holderIds = [...new Set(rows.map((r) => r.userId).filter(Boolean).map(String))]
    const holders = holderIds.length
        ? await bestEffort(req, 'dispatchHolders', new Map(), () => getCorporateCardUsersByIds(holderIds, corporateId, req))
        : new Map()
    rows.forEach((r) => { r.cardholder = r.userId ? holders.get(String(r.userId)) || null : null })

    return ok(res, 'Physical card dispatches fetched.', { count, rows: rows.map(serializeCardTracking) })
})
