const { Op, literal } = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const vendorLedgerEntries = require("../entities/vendorLedgerEntry");
const { NOT_APPLICABLE } = require("./journalPosting");
const ledgerChanges = require("./ledgerEntryChanges");
const { currentIp } = require("../../utils/requestContext");
const { ENTRY_NUMBER_PREFIXES, nextEntryNumber, withEntryNumber } = require("./entryNumbers");
const { gstFieldsOf } = require("./ledgerGst");

const ENTRY_KINDS = {
    creditNote: "CREDIT_NOTE",
    commission: "COMMISSION",
    costOfSales: "COST_OF_SALES",
    debitNote: "DEBIT_NOTE",
};

const ENTRY_TYPES = { entry: "ENTRY", reversal: "REVERSAL" };

const ENTRY_NUMBER_PREFIX_BY_KIND = {
    [ENTRY_KINDS.creditNote]: ENTRY_NUMBER_PREFIXES.vendorCreditNote,
    [ENTRY_KINDS.commission]: ENTRY_NUMBER_PREFIXES.vendorCommission,
    [ENTRY_KINDS.costOfSales]: ENTRY_NUMBER_PREFIXES.vendorCostOfSales,
    [ENTRY_KINDS.debitNote]: ENTRY_NUMBER_PREFIXES.vendorDebitNote,
};

const entryPrefixOf = kind =>
    ENTRY_NUMBER_PREFIX_BY_KIND[kind] || ENTRY_NUMBER_PREFIX_BY_KIND[ENTRY_KINDS.creditNote];

// A reversal keeps its own positive amount and is subtracted here, so the original row is
// never rewritten and any past balance stays reproducible.
const NET_AMOUNT = literal(
    "COALESCE(SUM(CASE WHEN entryType = 'REVERSAL' THEN -amount ELSE amount END), 0)"
);

const toNumber = value => Number(value) || 0;

const round2 = value => Math.round((toNumber(value) + Number.EPSILON) * 100) / 100;

const serializeEntry = row => {
    const plain = row && typeof row.get === "function" ? row.get({ plain: true }) : row;
    return {
        id: plain.id,
        vendorId: plain.vendorId,
        entryNumber: plain.entryNumber || null,
        kind: plain.kind || ENTRY_KINDS.creditNote,
        reference: plain.reference,
        amount: round2(plain.amount),
        ...gstFieldsOf(plain),
        issueDate: plain.issueDate,
        reason: plain.reason,
        againstCorporateTxnId: plain.againstCorporateTxnId,
        status: plain.status,
        posting: NOT_APPLICABLE,
        entryType: plain.entryType || ENTRY_TYPES.entry,
        reversesId: plain.reversesId || null,
        source: "MANUAL",
        hasDocument: true,
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

const scopedWhere = (vendorId, kind, range) => {
    const where = { vendorId, kind };
    if (range) where.issueDate = { [Op.between]: [range.from, range.to] };
    return where;
};

const listByVendor = async ({ vendorId, kind, range, limit, offset }) =>
    vendorLedgerEntries.findAndCountAll({
        where: scopedWhere(vendorId, kind, range),
        paranoid: false,
        order: [
            ["issueDate", "DESC"],
            ["id", "DESC"],
        ],
        limit,
        offset,
    });

const listAllByVendor = async ({ vendorId, kind, range }) =>
    vendorLedgerEntries.findAll({
        where: scopedWhere(vendorId, kind, range),
        paranoid: false,
        order: [
            ["issueDate", "ASC"],
            ["id", "ASC"],
        ],
        raw: true,
    });

const findEntry = async ({ id, vendorId, kind }) => {
    const where = { id, vendorId };
    if (kind) where.kind = kind;
    return vendorLedgerEntries.findOne({ where, raw: true });
};

const createEntry = ({
    vendorId,
    kind,
    amount,
    issueDate,
    reason,
    againstCorporateTxnId,
    gstInclusive,
    gstRate,
    taxableAmount,
    gstAmount,
    slip,
    actor,
}) =>
    withEntryNumber(entryPrefixOf(kind), (entryNumber, transaction) =>
        vendorLedgerEntries.create(
            {
                vendorId,
                entryNumber,
                kind,
                reference: entryNumber,
                amount,
                gstInclusive: gstInclusive !== false,
                gstRate: gstRate ?? null,
                taxableAmount: taxableAmount ?? null,
                gstAmount: gstAmount ?? null,
                issueDate,
                reason: reason || null,
                againstCorporateTxnId: againstCorporateTxnId || null,
                status: "OPEN",
                entryType: ENTRY_TYPES.entry,
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

const reverseEntry = ({ id, vendorId, kind, reason, actor }) =>
    sequelizeConfig.transaction(async transaction => {
        const where = { id, vendorId };
        if (kind) where.kind = kind;

        const row = await vendorLedgerEntries.findOne({ where, transaction, lock: true });
        if (!row || row.status === "VOIDED" || row.entryType === ENTRY_TYPES.reversal) return null;

        const entryNumber = await nextEntryNumber(entryPrefixOf(row.kind), transaction);
        const reversal = await vendorLedgerEntries.create(
            {
                vendorId: row.vendorId,
                entryNumber,
                kind: row.kind,
                reference: row.reference,
                amount: row.amount,
                gstInclusive: row.gstInclusive,
                gstRate: row.gstRate,
                taxableAmount: row.taxableAmount,
                gstAmount: row.gstAmount,
                issueDate: new Date().toISOString().slice(0, 10),
                reason: reason || null,
                againstCorporateTxnId: row.againstCorporateTxnId,
                status: "OPEN",
                entryType: ENTRY_TYPES.reversal,
                reversesId: row.id,
                recordedById: actor && actor.id,
                recordedByName: actor && actor.name,
                ipAddress: currentIp(),
            },
            { transaction }
        );

        await row.update(
            {
                status: "VOIDED",
                voidedById: actor && actor.id,
                voidedByName: actor && actor.name,
                voidedAt: new Date(),
                voidReason: reason,
            },
            { transaction }
        );

        return reversal;
    });

const flooredWhere = (where, accountingFloor) =>
    accountingFloor
        ? { [Op.and]: [where, { issueDate: { [Op.gt]: accountingFloor } }] }
        : where;

const sumManualEntries = async (vendorId, kind, range, accountingFloor = null) => {
    const [row] = await vendorLedgerEntries.findAll({
        attributes: [[NET_AMOUNT, "total"]],
        where: flooredWhere(scopedWhere(vendorId, kind, range), accountingFloor),
        raw: true,
    });

    return round2(row && row.total);
};

const sumManualEntriesByVendor = async (kind, accountingFloor = null) => {
    const rows = await vendorLedgerEntries.findAll({
        attributes: ["vendorId", [NET_AMOUNT, "total"]],
        where: flooredWhere({ kind }, accountingFloor),
        group: ["vendorId"],
        raw: true,
    });

    const map = {};
    rows.forEach(row => {
        map[row.vendorId] = round2(row.total);
    });
    return map;
};

const sumManualEntriesInRange = async (kind, range, accountingFloor = null) => {
    const [row] = await vendorLedgerEntries.findAll({
        attributes: [[NET_AMOUNT, "total"]],
        where: flooredWhere(
            { kind, issueDate: { [Op.between]: [range.from, range.to] } },
            accountingFloor
        ),
        raw: true,
    });

    return round2(row && row.total);
};

const countOpenEntries = async kind =>
    vendorLedgerEntries.count({
        where: { kind, status: "OPEN", entryType: ENTRY_TYPES.entry },
    });

const ENTRY_FIELDS = [
    ledgerChanges.field("amount", "amount", "amount"),
    ledgerChanges.field("taxableAmount", "taxableAmount", "amount"),
    ledgerChanges.field("gstAmount", "gst", "amount"),
    ledgerChanges.field("gstRate", "gstRate", "amount"),
    ledgerChanges.field("gstInclusive", "gstInclusive", "flag"),
    ledgerChanges.field("issueDate", "date", "date"),
    ledgerChanges.field("reason", "reason", "text"),
    ledgerChanges.field("againstCorporateTxnId", "againstOrder", "text"),
];

const changeTarget = ({ id, vendorId, kind, audit }) => ({
    model: vendorLedgerEntries,
    where: { id, vendorId, kind },
    fields: ENTRY_FIELDS,
    audit: { ...audit, table: "vendorLedgerEntries" },
});

const updateEntry = ({ values, slip, actor, changeReason, ...target }) =>
    ledgerChanges.editEntry({ ...changeTarget(target), values, slip, actor, changeReason });

const deleteEntry = ({ actor, changeReason, ...target }) =>
    ledgerChanges.deleteEntry({ ...changeTarget(target), actor, changeReason });

const tagEntryBooks = ({ id, vendorId, kind, synced, actor, audit }) =>
    ledgerChanges.tagBooks({
        model: vendorLedgerEntries,
        where: { id, vendorId, kind },
        synced,
        actor,
        audit: { ...audit, table: "vendorLedgerEntries" },
    });

const findFirstEntryDate = async vendorId => {
    const row = await vendorLedgerEntries.findOne({
        attributes: ["issueDate"],
        where: { vendorId },
        order: [["issueDate", "ASC"]],
        raw: true,
    });
    return row ? row.issueDate : null;
};

module.exports = {
    ENTRY_KINDS,
    ENTRY_TYPES,
    serializeEntry,
    listByVendor,
    listAllByVendor,
    findEntry,
    createEntry,
    reverseEntry,
    updateEntry,
    deleteEntry,
    tagEntryBooks,
    findFirstEntryDate,
    sumManualEntries,
    sumManualEntriesByVendor,
    sumManualEntriesInRange,
    countOpenEntries,
};
