const { Op, literal } = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const partnerLedgerEntries = require("../entities/partnerLedgerEntry");
const { NOT_APPLICABLE } = require("./journalPosting");
const ledgerChanges = require("./ledgerEntryChanges");
const { currentIp } = require("../../utils/requestContext");
const { ENTRY_NUMBER_PREFIXES, nextEntryNumber, withEntryNumber } = require("./entryNumbers");
const { gstFieldsOf } = require("./ledgerGst");

const ENTRY_KINDS = { debitNote: "DEBIT_NOTE" };

const ENTRY_TYPES = { entry: "ENTRY", reversal: "REVERSAL" };

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
        partnerCredentialId: plain.partnerCredentialId,
        entryNumber: plain.entryNumber || null,
        kind: plain.kind || ENTRY_KINDS.debitNote,
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

// What the Status pill reads on a row: a reversal first, then a voided one, else active.
const ENTRY_STATUS_FILTERS = {
    active: { entryType: { [Op.ne]: ENTRY_TYPES.reversal }, status: { [Op.ne]: "VOIDED" }, deletedAt: null },
    reversal: { entryType: ENTRY_TYPES.reversal, deletedAt: null },
    reversed: { entryType: { [Op.ne]: ENTRY_TYPES.reversal }, status: "VOIDED", deletedAt: null },
    deleted: { deletedAt: { [Op.ne]: null } },
};

const scopedWhere = (partnerCredentialId, kind, range) => {
    const where = { partnerCredentialId, kind };
    if (range) where.issueDate = { [Op.between]: [range.from, range.to] };
    return where;
};

const listByPartner = async ({
    partnerCredentialId,
    kind,
    range,
    searchText,
    status,
    limit,
    offset,
}) => {
    const where = scopedWhere(partnerCredentialId, kind, range);
    if (Object.hasOwn(ENTRY_STATUS_FILTERS, status)) Object.assign(where, ENTRY_STATUS_FILTERS[status]);
    if (searchText) {
        const like = { [Op.like]: `%${searchText}%` };
        where[Op.or] = [
            { entryNumber: like },
            { reference: like },
            { againstCorporateTxnId: like },
            { reason: like },
            { recordedByName: like },
        ];
    }

    return partnerLedgerEntries.findAndCountAll({
        where,
        paranoid: false,
        order: [
            ["issueDate", "DESC"],
            ["id", "DESC"],
        ],
        limit,
        offset,
    });
};

const listAllByPartner = async ({ partnerCredentialId, kind, range }) =>
    partnerLedgerEntries.findAll({
        where: scopedWhere(partnerCredentialId, kind, range),
        order: [
            ["issueDate", "ASC"],
            ["id", "ASC"],
        ],
        raw: true,
    });

const findEntry = async ({ id, partnerCredentialId, kind }) => {
    const where = { id, partnerCredentialId };
    if (kind) where.kind = kind;
    return partnerLedgerEntries.findOne({ where, raw: true });
};

const createEntry = ({
    partnerCredentialId,
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
    withEntryNumber(ENTRY_NUMBER_PREFIXES.partnerDebitNote, (entryNumber, transaction) =>
        partnerLedgerEntries.create(
            {
                partnerCredentialId,
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

// Writes a reversing row rather than erasing the original. The original keeps a VOIDED
// status so the list can render a pill, but no balance query ever reads that status.
const reverseEntry = ({ id, partnerCredentialId, kind, reason, actor }) =>
    sequelizeConfig.transaction(async transaction => {
        const where = { id, partnerCredentialId };
        if (kind) where.kind = kind;

        const row = await partnerLedgerEntries.findOne({ where, transaction, lock: true });
        if (!row || row.status === "VOIDED" || row.entryType === ENTRY_TYPES.reversal) return null;

        const entryNumber = await nextEntryNumber(ENTRY_NUMBER_PREFIXES.partnerDebitNote, transaction);
        const reversal = await partnerLedgerEntries.create(
            {
                partnerCredentialId: row.partnerCredentialId,
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

// No opening-date floor here: the controller refuses an entry dated on or before the
// partner's opening balance, the same guard payouts have.
const sumEntries = async (partnerCredentialId, kind, range = null) => {
    const [row] = await partnerLedgerEntries.findAll({
        attributes: [[NET_AMOUNT, "total"]],
        where: scopedWhere(partnerCredentialId, kind, range),
        raw: true,
    });

    return round2(row && row.total);
};

const sumEntriesByPartner = async kind => {
    const rows = await partnerLedgerEntries.findAll({
        attributes: ["partnerCredentialId", [NET_AMOUNT, "total"]],
        where: { kind },
        group: ["partnerCredentialId"],
        raw: true,
    });

    const map = {};
    rows.forEach(row => {
        map[row.partnerCredentialId] = round2(row.total);
    });
    return map;
};

const sumEntriesInRange = async (kind, range) => {
    const [row] = await partnerLedgerEntries.findAll({
        attributes: [[NET_AMOUNT, "total"]],
        where: { kind, issueDate: { [Op.between]: [range.from, range.to] } },
        raw: true,
    });

    return round2(row && row.total);
};

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

const changeTarget = ({ id, partnerCredentialId, kind, audit }) => ({
    model: partnerLedgerEntries,
    where: { id, partnerCredentialId, kind },
    fields: ENTRY_FIELDS,
    audit: { ...audit, table: "partnerLedgerEntries" },
});

const updateEntry = ({ values, slip, actor, changeReason, ...target }) =>
    ledgerChanges.editEntry({ ...changeTarget(target), values, slip, actor, changeReason });

const deleteEntry = ({ actor, changeReason, ...target }) =>
    ledgerChanges.deleteEntry({ ...changeTarget(target), actor, changeReason });

const tagEntryBooks = ({ id, partnerCredentialId, kind, synced, actor, audit }) =>
    ledgerChanges.tagBooks({
        model: partnerLedgerEntries,
        where: { id, partnerCredentialId, kind },
        synced,
        actor,
        audit: { ...audit, table: "partnerLedgerEntries" },
    });

const findFirstEntryDate = async partnerCredentialId => {
    const row = await partnerLedgerEntries.findOne({
        attributes: ["issueDate"],
        where: { partnerCredentialId },
        order: [["issueDate", "ASC"]],
        raw: true,
    });
    return row ? row.issueDate : null;
};

module.exports = {
    ENTRY_KINDS,
    ENTRY_TYPES,
    ENTRY_STATUS_FILTERS,
    serializeEntry,
    listByPartner,
    listAllByPartner,
    findEntry,
    createEntry,
    reverseEntry,
    updateEntry,
    deleteEntry,
    tagEntryBooks,
    findFirstEntryDate,
    sumEntries,
    sumEntriesByPartner,
    sumEntriesInRange,
};
