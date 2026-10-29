const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const { findAndCountPhysicalTracking } = require('../../models/use-cases/cardIssuance')
const { serializeCardTracking, TRACKING_STATUS_FILTERS } = require('../../utils/serializeCardTracking')
const { parsePaging, attachCardholders, isAdmin } = require('../../utils/cardHelpers')
const { resolveScope } = require('./cardTransactions')

const STATUS_FILTERS = Object.keys(TRACKING_STATUS_FILTERS)

/**
 * GET /corporate/:corporateId/corporate-cards/cards/physical-tracking  (admin or cardholder)
 *
 * The "Physical card tracking" table: one row per physical card order, with the delivery address it was
 * ordered to and whatever the issuer has since told us about the courier. Its own endpoint rather than a
 * flag on the cards list, because a postal address and courier history have no business travelling in
 * the payload a cardholder gets for their own cards.
 *
 * Dual-role on the same terms as the cards and transactions lists: an admin sees the whole corporate and
 * may narrow to one member with ?userId, while a cardholder is pinned to their own orders by
 * resolveScope and cannot widen the scope. resolveScope — not listCards' inline check — because it
 * REFUSES a non-admin session that carries no cardholder identity instead of silently dropping the
 * predicate and returning every card in the corporate.
 */
exports.listPhysicalTracking = asyncHandler(async (req, res, next) => {
    const scope = resolveScope(req)
    if (scope.error) return next(new ErrorResponse(scope.error, 400))

    // Bracket notation (?status[a]=b) arrives as an object, which would reach the where-builder as one.
    const raw = typeof req.query.status === 'string' ? req.query.status.trim() : ''
    if (raw && !STATUS_FILTERS.includes(raw)) {
        return next(new ErrorResponse('Invalid status filter.', 400))
    }
    const status = raw ? TRACKING_STATUS_FILTERS[raw] : undefined

    const { limit, offset } = parsePaging(req)
    const { count, rows } = await findAndCountPhysicalTracking({ corporateId: scope.corporateId, cardholder: scope.cardholder, status, limit, offset })

    // Cardholder name and department live in the shared directory, not this service's database. Only the
    // admin table has columns for them — a cardholder is reading their own orders, so the cross-service
    // hydration is skipped rather than spent resolving a name the caller already knows.
    if (isAdmin(req)) await attachCardholders(rows, req)

    return res.status(200).json({
        status: true,
        message: 'Physical card tracking fetched.',
        data: {
            count,
            page: Math.floor(offset / limit) + 1,
            itemsPerPage: limit,
            rows: rows.map(serializeCardTracking),
        },
        responseCode: '000',
    })
})
