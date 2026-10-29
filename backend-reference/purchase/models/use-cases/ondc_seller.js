const { Op, fn, col } = require("sequelize");
const asyncHandler = require('./../../middlewares/async');
const ondcSellers = require('./../entities/ondc_seller');
const ondcOrders = require('./../entities/ondc_order');
const { containsLike } = require('../../utils/escapeLike');

// Fields refreshed from every on_init. Deliberately EXCLUDES the Cashfree
// registration columns: a seller already onboarded as an Easy Split vendor must
// not lose that mapping just because the BPP echoed its settlement block again.
const REFRESHABLE = [
    'bppUri', 'vendorName', 'domain',
    'settlementType', 'settlementCounterparty', 'settlementPhase',
    'upiAddress', 'settlementBankAccountNo', 'settlementIfscCode',
    'beneficiaryName', 'bankName', 'branchName', 'settlementDetails',
    'collectedBy', 'buyerFinderFeeType', 'buyerFinderFeeAmount',
    'gstNumber', 'panNumber', 'bppTerms',
    'splitEligible', 'ineligibleReason',
    'lastInitTransactionId', 'lastSeenAt',
    // Seller NP identity/contact from the on_search catalog descriptor — refreshed
    // like the rest, so a BPP that starts publishing contacts backfills itself.
    'npName', 'npContactEmail', 'npContactPhone',
];

/** Payout statuses that still hold seller money at Cashfree (pending settle). */
const PENDING_PAYOUT_STATUSES = ['HELD', 'RELEASING', 'RELEASE_FAILED'];
exports.PENDING_PAYOUT_STATUSES = PENDING_PAYOUT_STATUSES;

/**
 * Attach pending-settle aggregates onto seller rows (pure — unit-testable).
 * @param {Array} sellers plain ondcSellers rows with cashfreeVendorId
 * @param {Map<string,{pendingToSettle:number,pendingOrderCount:number,earliestPayoutDueAt:Date|null}>} aggregatesByVendorId
 */
const attachPendingSettle = (sellers = [], aggregatesByVendorId = new Map()) =>
    sellers.map((s) => {
        const agg = aggregatesByVendorId.get(String(s.cashfreeVendorId)) || {};
        return {
            id: s.id,
            vendorName: s.vendorName || null,
            bppId: s.bppId,
            providerId: s.providerId,
            cashfreeVendorId: s.cashfreeVendorId,
            cashfreeVendorStatus: s.cashfreeVendorStatus || null,
            splitEligible: s.splitEligible ?? null,
            ineligibleReason: s.ineligibleReason || null,
            vendorSyncedAt: s.vendorSyncedAt || null,
            pendingToSettle: parseFloat(Number(agg.pendingToSettle || 0).toFixed(2)),
            pendingOrderCount: parseInt(agg.pendingOrderCount || 0, 10) || 0,
            earliestPayoutDueAt: agg.earliestPayoutDueAt || null,
        };
    });
exports.attachPendingSettle = attachPendingSettle;

/**
 * Upsert a seller keyed on (bppId, providerId). Returns the row.
 *
 * Not `Model.upsert` — that would need every column in the payload and would
 * happily null out the Cashfree vendor mapping. Find-then-update keeps the
 * registration columns untouched, and the unique index means a concurrent insert
 * loses the race cleanly (we retry the read).
 */
exports.upsertOndcSeller = asyncHandler(async (data) => {
    const { bppId, providerId } = data;
    if (!bppId || !providerId) return null;

    const patch = {};
    for (const field of REFRESHABLE) {
        if (data[field] !== undefined) patch[field] = data[field];
    }

    const existing = await ondcSellers.findOne({ where: { bppId, providerId } });
    if (existing) {
        await existing.update(patch);
        return existing.get({ plain: true });
    }

    try {
        const created = await ondcSellers.create({ bppId, providerId, ...patch });
        return created.get({ plain: true });
    } catch (error) {
        // lost the unique-index race with a concurrent on_init for the same seller
        const raced = await ondcSellers.findOne({ where: { bppId, providerId } });
        if (raced) {
            await raced.update(patch);
            return raced.get({ plain: true });
        }
        throw error;
    }
});

/** One seller by its ONDC key. */
exports.findOndcSeller = asyncHandler(async ({ bppId, providerId }) => {
    if (!bppId || !providerId) return null;
    return await ondcSellers.findOne({ where: { bppId, providerId }, raw: true });
});

/**
 * Batch lookup for a checkout's confirmed groups — one query instead of N.
 * `keys` is `[{ bppId, providerId }, …]`; results are keyed `bppId|providerId`.
 */
exports.findOndcSellersByKeys = asyncHandler(async (keys = []) => {
    const usable = keys.filter((key) => key?.bppId && key?.providerId);
    if (!usable.length) return new Map();

    // exact pairs, not a cross-product of the two id lists — two sellers sharing
    // a bppId must not match each other's providerId
    const rows = await ondcSellers.findAll({
        where: {
            [Op.or]: usable.map(({ bppId, providerId }) => ({ bppId, providerId })),
        },
        raw: true,
    });
    return new Map(rows.map((row) => [`${row.bppId}|${row.providerId}`, row]));
});

/** Record the outcome of an Easy Split vendor registration attempt. */
exports.updateOndcSellerVendor = asyncHandler(async ({
    id,
    cashfreeVendorId,
    cashfreeVendorStatus,
    lastSyncError = null,
}) => {
    if (!id) return null;
    return await ondcSellers.update(
        {
            ...(cashfreeVendorId !== undefined && { cashfreeVendorId }),
            ...(cashfreeVendorStatus !== undefined && { cashfreeVendorStatus }),
            lastSyncError,
            vendorSyncedAt: new Date(),
        },
        { where: { id } }
    );
});

/**
 * Admin list: every Easy Split–registered seller (non-null cashfreeVendorId)
 * with pending-to-settle totals from held SPLIT orders.
 */
exports.findAllOndcEasySplitSellers = asyncHandler(async ({
    searchText = '',
    page = 1,
    itemsPerPage = 10,
    sort = 'DESC',
    sortField = 'vendorSyncedAt',
} = {}) => {
    const where = {
        cashfreeVendorId: { [Op.ne]: null },
    };
    const q = String(searchText || '').trim();
    if (q) {
        where[Op.or] = [
            { vendorName: { [Op.like]: containsLike(q) } },
            { cashfreeVendorId: { [Op.like]: containsLike(q) } },
            { providerId: { [Op.like]: containsLike(q) } },
            { bppId: { [Op.like]: containsLike(q) } },
        ];
    }

    const allowedSort = new Set([
        'vendorName',
        'cashfreeVendorId',
        'cashfreeVendorStatus',
        'vendorSyncedAt',
        'createdAt',
        'updatedAt',
        'id',
    ]);
    const orderField = allowedSort.has(sortField) ? sortField : 'vendorSyncedAt';
    const orderDir = String(sort).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const limit = Math.max(1, parseInt(itemsPerPage, 10) || 10);
    const offset = Math.max(0, ((parseInt(page, 10) || 1) - 1) * limit);

    const { rows, count } = await ondcSellers.findAndCountAll({
        where,
        order: [[orderField, orderDir], ['id', 'DESC']],
        limit,
        offset,
        raw: true,
    });

    const vendorIds = rows.map((r) => r.cashfreeVendorId).filter(Boolean);
    const aggregatesByVendorId = new Map();

    if (vendorIds.length) {
        const aggregates = await ondcOrders.findAll({
            attributes: [
                'splitVendorId',
                [fn('SUM', col('splitAmount')), 'pendingToSettle'],
                [fn('COUNT', col('id')), 'pendingOrderCount'],
                [fn('MIN', col('payoutDueAt')), 'earliestPayoutDueAt'],
            ],
            where: {
                splitVendorId: { [Op.in]: vendorIds },
                splitStatus: 'SPLIT',
                payoutStatus: { [Op.in]: PENDING_PAYOUT_STATUSES },
            },
            group: ['splitVendorId'],
            raw: true,
        });
        for (const a of aggregates) {
            aggregatesByVendorId.set(String(a.splitVendorId), {
                pendingToSettle: parseFloat(a.pendingToSettle || 0),
                pendingOrderCount: parseInt(a.pendingOrderCount || 0, 10) || 0,
                earliestPayoutDueAt: a.earliestPayoutDueAt || null,
            });
        }
    }

    return {
        rows: attachPendingSettle(rows, aggregatesByVendorId),
        count,
    };
});
