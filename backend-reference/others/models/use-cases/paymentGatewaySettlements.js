const { Op, literal } = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const paymentGatewaySettlements = require("../entities/paymentGatewaySettlement");
const { NOT_APPLICABLE } = require("./journalPosting");
const ledgerChanges = require("./ledgerEntryChanges");
const { currentIp } = require("../../utils/requestContext");
const { ENTRY_NUMBER_PREFIXES, nextEntryNumber, withEntryNumber } = require("./entryNumbers");

const SETTLEMENT_MODES = ["NEFT", "RTGS", "IMPS", "UPI", "CHEQUE", "OTHER"];

const ENTRY_KINDS = { receipt: "RECEIPT", fee: "FEE", opening: "OPENING" };

// The Received table lists the opening beside the receipts, because it is the position the
// receipts are working down. Bills stays purely what the gateway kept.
const RECEIVED_TABLE_KINDS = [ENTRY_KINDS.receipt, ENTRY_KINDS.opening];

const ENTRY_TYPES = { entry: "ENTRY", reversal: "REVERSAL" };

// A reversal keeps its own positive amount and is subtracted here, so the original row is
// never rewritten and any past balance stays reproducible.
const NET_AMOUNT = literal(
    "COALESCE(SUM(CASE WHEN entryType = 'REVERSAL' THEN -amount ELSE amount END), 0)"
);

const toNumber = value => Number(value) || 0;

const round2 = value => Math.round((toNumber(value) + Number.EPSILON) * 100) / 100;

const serializeSettlement = row => {
    const plain = row && typeof row.get === "function" ? row.get({ plain: true }) : row;
    const expected =
        plain.expectedAmount === null || plain.expectedAmount === undefined
            ? null
            : round2(plain.expectedAmount);

    return {
        id: plain.id,
        gatewayAccountId: plain.gatewayAccountId,
        entryNumber: plain.entryNumber || null,
        settlementId: plain.settlementId || null,
        entryKind: plain.entryKind || ENTRY_KINDS.receipt,
        entryType: plain.entryType || ENTRY_TYPES.entry,
        amount: round2(plain.amount),
        expectedAmount: expected,
        entryDate: plain.entryDate,
        reference: plain.reference,
        mode: plain.mode,
        note: plain.note,
        status: plain.status,
        posting: NOT_APPLICABLE,
        reversesId: plain.reversesId || null,
        slipKey: plain.slipKey || null,
        slipName: plain.slipName || null,
        slipFormat: plain.slipFormat || null,
        recordedByName: plain.recordedByName,
        ipAddress: plain.ipAddress || null,
        voidedByName: plain.voidedByName,
        voidedAt: plain.voidedAt,
        voidReason: plain.voidReason,
        createdAt: plain.createdAt,
        ...ledgerChanges.booksFieldsOf(plain),
    };
};

const scopedWhere = (gatewayAccountId, range, entryKind) => {
    const where = { gatewayAccountId };
    if (entryKind) where.entryKind = Array.isArray(entryKind) ? { [Op.in]: entryKind } : entryKind;
    if (range) where.entryDate = { [Op.between]: [range.from, range.to] };
    return where;
};

// What the Status pill reads on a row: a reversal first, then a voided one, then the opening,
// and anything else is what its kind says: received or charged.
const live = {
    entryType: { [Op.ne]: ENTRY_TYPES.reversal },
    status: { [Op.ne]: "VOIDED" },
    deletedAt: null,
};

const SETTLEMENT_STATUS_FILTERS = {
    received: { ...live, entryKind: ENTRY_KINDS.receipt },
    charged: { ...live, entryKind: ENTRY_KINDS.fee },
    opening: { ...live, entryKind: ENTRY_KINDS.opening },
    reversal: { entryType: ENTRY_TYPES.reversal, deletedAt: null },
    reversed: { entryType: { [Op.ne]: ENTRY_TYPES.reversal }, status: "VOIDED", deletedAt: null },
    deleted: { deletedAt: { [Op.ne]: null } },
};

const listByGateway = async ({
    gatewayAccountId,
    entryKind,
    range,
    searchText,
    status,
    mode,
    limit,
    offset,
}) => {
    const where = scopedWhere(gatewayAccountId, range, entryKind);
    // ANDed rather than merged, so a status of the other table's kind lists nothing here
    // instead of overriding the kinds this table is scoped to.
    if (Object.hasOwn(SETTLEMENT_STATUS_FILTERS, status)) {
        where[Op.and] = [SETTLEMENT_STATUS_FILTERS[status]];
    }
    if (SETTLEMENT_MODES.includes(mode)) where.mode = mode;
    if (searchText) {
        const like = { [Op.like]: `%${searchText}%` };
        where[Op.or] = [{ entryNumber: like }, { reference: like }, { note: like }, { recordedByName: like }];
    }

    return paymentGatewaySettlements.findAndCountAll({
        where,
        paranoid: false,
        order: [
            ["entryDate", "DESC"],
            ["id", "DESC"],
        ],
        limit,
        offset,
    });
};

const listAllByGateway = async ({ gatewayAccountId, range }) =>
    paymentGatewaySettlements.findAll({
        where: scopedWhere(gatewayAccountId, range),
        order: [
            ["entryDate", "ASC"],
            ["id", "ASC"],
        ],
        raw: true,
    });

const settlementPrefixOf = row => {
    if (row.entryKind === ENTRY_KINDS.opening) return ENTRY_NUMBER_PREFIXES.openingBalance;
    return row.entryKind === ENTRY_KINDS.fee
        ? ENTRY_NUMBER_PREFIXES.gatewayBill
        : ENTRY_NUMBER_PREFIXES.gatewayReceipt;
};

const createReceipt = ({ gatewayAccountId, amount, entryDate, reference, mode, note, slip, actor }) =>
    withEntryNumber(ENTRY_NUMBER_PREFIXES.gatewayReceipt, (entryNumber, transaction) =>
        paymentGatewaySettlements.create(
            {
                gatewayAccountId,
                entryNumber,
                entryKind: ENTRY_KINDS.receipt,
                entryType: ENTRY_TYPES.entry,
                amount,
                expectedAmount: null,
                entryDate,
                reference: reference || null,
                mode,
                note: note || null,
                status: "ACTIVE",
                slipKey: (slip && slip.key) || null,
                slipName: (slip && slip.name) || null,
                slipFormat: (slip && slip.format) || null,
                recordedById: actor && actor.id,
                recordedByName: actor && actor.name,
                ipAddress: currentIp(),
            },
            { transaction }
        )
    );

// The position carried in from before the portal started recording. It has no receipt and
// no fee behind it, so it carries no reference and no mode of its own.
const createOpeningBalance = ({ gatewayAccountId, amount, asOfDate, note, slip, actor }) =>
    withEntryNumber(ENTRY_NUMBER_PREFIXES.openingBalance, (entryNumber, transaction) =>
        paymentGatewaySettlements.create(
            {
                gatewayAccountId,
                entryNumber,
                entryKind: ENTRY_KINDS.opening,
                entryType: ENTRY_TYPES.entry,
                amount,
                expectedAmount: null,
                entryDate: asOfDate,
                reference: null,
                mode: "OTHER",
                note: note || null,
                status: "ACTIVE",
                slipKey: (slip && slip.key) || null,
                slipName: (slip && slip.name) || null,
                slipFormat: (slip && slip.format) || null,
                recordedById: actor && actor.id,
                recordedByName: actor && actor.name,
                ipAddress: currentIp(),
            },
            { transaction }
        )
    );

const findOpeningBalance = async gatewayAccountId =>
    paymentGatewaySettlements.findOne({
        where: {
            gatewayAccountId,
            entryKind: ENTRY_KINDS.opening,
            entryType: ENTRY_TYPES.entry,
            status: "ACTIVE",
        },
        raw: true,
    });

const listGatewaysWithOpening = async () => {
    const rows = await paymentGatewaySettlements.findAll({
        attributes: ["gatewayAccountId", "entryDate"],
        where: {
            entryKind: ENTRY_KINDS.opening,
            entryType: ENTRY_TYPES.entry,
            status: "ACTIVE",
        },
        raw: true,
    });

    const map = {};
    rows.forEach(row => {
        map[row.gatewayAccountId] = row.entryDate;
    });
    return map;
};

const contraOf = (row, reason, actor, entryNumber) => ({
    gatewayAccountId: row.gatewayAccountId,
    entryNumber,
    settlementId: row.settlementId,
    entryKind: row.entryKind,
    entryType: ENTRY_TYPES.reversal,
    amount: row.amount,
    expectedAmount: row.expectedAmount,
    entryDate: new Date().toISOString().slice(0, 10),
    reference: row.reference,
    mode: row.mode,
    note: reason || null,
    status: "ACTIVE",
    reversesId: row.id,
    recordedById: actor && actor.id,
    recordedByName: actor && actor.name,
    ipAddress: currentIp(),
});

// Reversal is offered on both receipts and standalone fees. An opening stands alone and
// reverses by itself.
const reverseSettlement = ({ id, gatewayAccountId, reason, actor }) =>
    sequelizeConfig.transaction(async transaction => {
        const head = await paymentGatewaySettlements.findOne({
            where: {
                id,
                gatewayAccountId,
                entryKind: { [Op.in]: [ENTRY_KINDS.receipt, ENTRY_KINDS.opening, ENTRY_KINDS.fee] },
            },
            transaction,
        });
        if (!head || head.entryType === ENTRY_TYPES.reversal) return null;

        // Live legs are locked in id order, so two reversals of one settlement queue up.
        const legs = await paymentGatewaySettlements.findAll({
            where: head.settlementId
                ? {
                      gatewayAccountId,
                      settlementId: head.settlementId,
                      entryType: ENTRY_TYPES.entry,
                      status: "ACTIVE",
                  }
                : { id: head.id, status: "ACTIVE" },
            order: [["id", "ASC"]],
            transaction,
            lock: true,
        });
        if (!legs.some(leg => leg.id === head.id)) return null;

        const reversals = [];
        for (const leg of legs) {
            const entryNumber = await nextEntryNumber(settlementPrefixOf(leg), transaction);
            const reversal = await paymentGatewaySettlements.create(
                contraOf(leg, reason, actor, entryNumber),
                { transaction }
            );
            await leg.update(
                {
                    status: "VOIDED",
                    voidedById: actor && actor.id,
                    voidedByName: actor && actor.name,
                    voidedAt: new Date(),
                    voidReason: reason,
                },
                { transaction }
            );
            reversals.push(reversal);
        }

        return reversals;
    });

const sumByKind = async (gatewayAccountId, entryKind, range) => {
    const [row] = await paymentGatewaySettlements.findAll({
        attributes: [[NET_AMOUNT, "total"]],
        where: scopedWhere(gatewayAccountId, range, entryKind),
        raw: true,
    });

    return round2(row && row.total);
};

const sumReceivedFromGateway = async (gatewayAccountId, range) =>
    sumByKind(gatewayAccountId, ENTRY_KINDS.receipt, range);

const sumFeesForGateway = async (gatewayAccountId, range) =>
    sumByKind(gatewayAccountId, ENTRY_KINDS.fee, range);

// Never scoped to a range: the opening is the position everything else is measured from, so
// a date filter must not make it disappear and leave the balance short by it.
const sumOpeningForGateway = async gatewayAccountId =>
    sumByKind(gatewayAccountId, ENTRY_KINDS.opening, null);

// Both kinds in one pass, grouped, for the list snapshot.
const sumSettledByGateway = async () => {
    const rows = await paymentGatewaySettlements.findAll({
        attributes: ["gatewayAccountId", "entryKind", [NET_AMOUNT, "total"]],
        group: ["gatewayAccountId", "entryKind"],
        raw: true,
    });

    const map = {};
    rows.forEach(row => {
        const bucket = map[row.gatewayAccountId] || { received: 0, fees: 0, opening: 0 };
        if (row.entryKind === ENTRY_KINDS.fee) bucket.fees = round2(row.total);
        else if (row.entryKind === ENTRY_KINDS.opening) bucket.opening = round2(row.total);
        else bucket.received = round2(row.total);
        map[row.gatewayAccountId] = bucket;
    });
    return map;
};

const sumReceivedInRange = async range => {
    const [row] = await paymentGatewaySettlements.findAll({
        attributes: [[NET_AMOUNT, "total"]],
        where: {
            entryKind: ENTRY_KINDS.receipt,
            entryDate: { [Op.between]: [range.from, range.to] },
        },
        raw: true,
    });

    return round2(row && row.total);
};

// The date the last live receipt covered, which is what the card names and what the
// statement uses to close its final group.
const findLastReceipt = async gatewayAccountId =>
    paymentGatewaySettlements.findOne({
        where: {
            gatewayAccountId,
            status: "ACTIVE",
            entryKind: ENTRY_KINDS.receipt,
            entryType: ENTRY_TYPES.entry,
        },
        order: [
            ["entryDate", "DESC"],
            ["id", "DESC"],
        ],
        raw: true,
    });

const countGatewaysSettledInRange = async range =>
    paymentGatewaySettlements.count({
        where: {
            status: "ACTIVE",
            entryKind: ENTRY_KINDS.receipt,
            entryType: ENTRY_TYPES.entry,
            entryDate: { [Op.between]: [range.from, range.to] },
        },
        distinct: true,
        col: "gatewayAccountId",
    });

const createFee = ({ gatewayAccountId, amount, entryDate, reference, mode, note, slip, actor }) =>
    withEntryNumber(ENTRY_NUMBER_PREFIXES.gatewayBill, (entryNumber, transaction) =>
        paymentGatewaySettlements.create(
            {
                gatewayAccountId,
                entryNumber,
                entryKind: ENTRY_KINDS.fee,
                entryType: ENTRY_TYPES.entry,
                amount,
                expectedAmount: null,
                entryDate,
                reference: reference || null,
                mode,
                note: note || null,
                status: "ACTIVE",
                slipKey: (slip && slip.key) || null,
                slipName: (slip && slip.name) || null,
                slipFormat: (slip && slip.format) || null,
                recordedById: actor && actor.id,
                recordedByName: actor && actor.name,
                ipAddress: currentIp(),
            },
            { transaction }
        )
    );

const ENTRY_FIELDS = [
    ledgerChanges.field("amount", "amount", "amount"),
    ledgerChanges.field("entryDate", "date", "date"),
    ledgerChanges.field("reference", "reference", "text"),
    ledgerChanges.field("mode", "mode", "text"),
    ledgerChanges.field("note", "note", "text"),
];

const OPENING_FIELDS = [
    ledgerChanges.field("amount", "amount", "amount"),
    ledgerChanges.field("entryDate", "date", "date"),
    ledgerChanges.field("note", "note", "text"),
];

const RECORDED_WITH_FEE =
    "This entry was recorded together with its fee, so it can only be reversed";

const changeTarget = ({ id, gatewayAccountId, entryKind, audit }) => ({
    model: paymentGatewaySettlements,
    where: { id, gatewayAccountId, entryKind },
    fields: entryKind === ENTRY_KINDS.opening ? OPENING_FIELDS : ENTRY_FIELDS,
    audit: { ...audit, table: "paymentGatewaySettlements" },
    guard: row => (row.settlementId ? RECORDED_WITH_FEE : null),
});

const updateSettlement = ({ values, slip, actor, changeReason, ...target }) =>
    ledgerChanges.editEntry({ ...changeTarget(target), values, slip, actor, changeReason });

const deleteSettlement = ({ actor, changeReason, ...target }) =>
    ledgerChanges.deleteEntry({ ...changeTarget(target), actor, changeReason });

const tagSettlementBooks = ({ id, gatewayAccountId, entryKinds, synced, actor, audit }) =>
    ledgerChanges.tagBooks({
        model: paymentGatewaySettlements,
        where: { id, gatewayAccountId, entryKind: { [Op.in]: entryKinds } },
        synced,
        actor,
        audit: { ...audit, table: "paymentGatewaySettlements" },
    });

const findFirstEntryDate = async gatewayAccountId => {
    const row = await paymentGatewaySettlements.findOne({
        attributes: ["entryDate"],
        where: { gatewayAccountId, entryKind: { [Op.ne]: ENTRY_KINDS.opening } },
        order: [["entryDate", "ASC"]],
        raw: true,
    });
    return row ? row.entryDate : null;
};

module.exports = {
    SETTLEMENT_MODES,
    ENTRY_KINDS,
    ENTRY_TYPES,
    RECEIVED_TABLE_KINDS,
    SETTLEMENT_STATUS_FILTERS,
    serializeSettlement,
    listByGateway,
    listAllByGateway,
    createReceipt,
    createFee,
    createOpeningBalance,
    findOpeningBalance,
    listGatewaysWithOpening,
    reverseSettlement,
    updateSettlement,
    deleteSettlement,
    tagSettlementBooks,
    findFirstEntryDate,
    sumReceivedFromGateway,
    sumFeesForGateway,
    sumOpeningForGateway,
    sumSettledByGateway,
    sumReceivedInRange,
    findLastReceipt,
    countGatewaysSettledInRange,
};
