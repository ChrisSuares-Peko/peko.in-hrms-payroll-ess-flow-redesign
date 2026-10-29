const CARD_SERVICE_LABEL = require('../constants/service')

/**
 * Who a session acts as, and what this service may read off it.
 *
 * A cardholder is an EMPLOYEE: one `users` row, one id space, whichever service invited them. The role and
 * status this service cares about are one entry among that employee's service memberships, located by this
 * service's own label — so a second service granted to the same person neither moves nor shadows them.
 *
 * Deliberately a leaf module with no requires beyond its own label: cardHelpers pulls in entities, the shared
 * directory and the audit use-case, so a query builder that only needed a WHERE fragment would drag that
 * whole graph into every suite that mocks the database config.
 */

const membershipsOf = (req) => (Array.isArray(req?.user?.serviceMemberships) ? req.user.serviceMemberships : [])

const sameLabel = (a, b) =>
    typeof a === 'string' && typeof b === 'string' && a.trim().toLowerCase() === b.trim().toLowerCase()

/** This service's entry on the session, or null when the employee does not hold it. */
const cardMembership = (req) =>
    membershipsOf(req).find((entry) => sameLabel(entry?.label, CARD_SERVICE_LABEL)) || null

const holdsCardMembership = (req) => {
    const membership = cardMembership(req)
    if (!membership) return false
    return membership.hasAccess !== false && membership.status !== 'INACTIVE'
}

const membershipRole = (req) => cardMembership(req)?.role ?? null

/** The identity a SESSION acts as, or null when it holds no cardholder identity at all. */
const cardholderIdentity = (req) => {
    const userId = req.user?.employeeProfileId
    if (!userId || !holdsCardMembership(req)) return null
    return { userId }
}

/** The identity a stored ROW is read under. */
const rowCardholderIdentity = (row) => (row?.userId ? { userId: row.userId } : null)

/**
 * The WHERE fragment matching one cardholder.
 *
 * Returns null when there is no identity, which every caller must treat as "refuse" and never as "no filter":
 * dropping the predicate is what returned an entire corporate's cards.
 */
const cardholderWhere = (identity) => (identity?.userId ? { userId: identity.userId } : null)

/** Whether a stored row belongs to a cardholder. */
const rowBelongsToCardholder = (row, identity) => {
    if (!identity?.userId) return false
    return String(row?.userId ?? '') === String(identity.userId)
}

/**
 * The cardholder's own name, email and mobile.
 *
 * The KYC submission is built from these and every audit row is signed with them, so an empty name here
 * reaches Pine Labs as an empty name.
 */
const cardholderProfile = (req) => {
    const identity = cardholderIdentity(req)
    return {
        id: identity?.userId ?? null,
        name: req.user?.employeeName || null,
        email: req.user?.employeeEmail || null,
        mobileNo: req.user?.employeeMobile || null,
    }
}

/** The identity column, for a row being WRITTEN on behalf of an already-resolved cardholder. */
const cardholderColumnsOf = (source) => ({ userId: source?.userId ?? null })

const cardholderColumnsForSession = (req) => cardholderColumnsOf(cardholderIdentity(req))

/** Columns for a cardholder resolved from the shared directory, which returns a bare `id`. */
const cardholderColumnsOfDirectoryRow = (row) => ({ userId: row?.id ?? null })

module.exports = {
    CARD_SERVICE_LABEL,
    cardMembership,
    holdsCardMembership,
    membershipRole,
    cardholderIdentity,
    cardholderProfile,
    rowCardholderIdentity,
    cardholderWhere,
    rowBelongsToCardholder,
    cardholderColumnsOf,
    cardholderColumnsForSession,
    cardholderColumnsOfDirectoryRow,
}
