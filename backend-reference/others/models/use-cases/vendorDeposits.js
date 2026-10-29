const { Op, literal } = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const vendorDeposits = require("../entities/vendorDeposit");
const { NOT_APPLICABLE } = require("./journalPosting");
const ledgerChanges = require("./ledgerEntryChanges");
const { currentIp } = require("../../utils/requestContext");
const { ENTRY_NUMBER_PREFIXES, nextEntryNumber, withEntryNumber } = require("./entryNumbers");

const DEPOSIT_MODES = ["NEFT", "RTGS", "IMPS", "UPI", "CHEQUE", "OTHER"];

const ENTRY_TYPES = { deposit: "DEPOSIT", opening: "OPENING", reversal: "REVERSAL" };

// A reversal keeps its own positive amount and is subtracted here, so the original row
// is never rewritten and any past balance stays reproducible.
const NET_AMOUNT = literal(
    "COALESCE(SUM(CASE WHEN entryType = 'REVERSAL' THEN -amount ELSE amount END), 0)"
);

const toNumber = value => Number(value) || 0;

const round2 = value => Math.round((toNumber(value) + Number.EPSILON) * 100) / 100;

const serializeDeposit = row => {
    const plain = row && typeof row.get === "function" ? row.get({ plain: true }) : row;
    return {
        id: plain.id,
        vendorId: plain.vendorId,
        entryNumber: plain.entryNumber || null,
        amount: round2(plain.amount),
        depositDate: plain.depositDate,
        reference: plain.reference,
        mode: plain.mode,
        note: plain.note,
        status: plain.status,
        posting: NOT_APPLICABLE,
        entryType: plain.entryType || ENTRY_TYPES.deposit,
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

// What the Status pill reads on a deposit row: a reversal first, then a voided one, then the
// opening, and anything else is an active deposit.
const DEPOSIT_STATUS_FILTERS = {
    active: { entryType: ENTRY_TYPES.deposit, status: { [Op.ne]: "VOIDED" }, deletedAt: null },
    opening: { entryType: ENTRY_TYPES.opening, status: { [Op.ne]: "VOIDED" }, deletedAt: null },
    reversal: { entryType: ENTRY_TYPES.reversal, deletedAt: null },
    reversed: { entryType: { [Op.ne]: ENTRY_TYPES.reversal }, status: "VOIDED", deletedAt: null },
    deleted: { deletedAt: { [Op.ne]: null } },
};

const listByVendor = async ({ vendorId, range, searchText, status, mode, limit, offset }) => {
    const where = { vendorId };
    if (range) where.depositDate = { [Op.between]: [range.from, range.to] };
    if (Object.hasOwn(DEPOSIT_STATUS_FILTERS, status)) Object.assign(where, DEPOSIT_STATUS_FILTERS[status]);
    if (DEPOSIT_MODES.includes(mode)) where.mode = mode;
    if (searchText) {
        const like = { [Op.like]: `%${searchText}%` };
        where[Op.or] = [{ entryNumber: like }, { reference: like }, { note: like }, { recordedByName: like }];
    }

    return vendorDeposits.findAndCountAll({
        where,
        paranoid: false,
        order: [
            ["depositDate", "DESC"],
            ["id", "DESC"],
        ],
        limit,
        offset,
    });
};

const findOpeningBalance = async vendorId =>
    vendorDeposits.findOne({
        where: { vendorId, entryType: ENTRY_TYPES.opening, status: "ACTIVE" },
    });

const depositPrefixOf = row =>
    row.entryType === ENTRY_TYPES.opening
        ? ENTRY_NUMBER_PREFIXES.openingBalance
        : ENTRY_NUMBER_PREFIXES.vendorDeposit;

const createDeposit = ({ vendorId, amount, depositDate, reference, mode, note, slip, actor }) =>
    withEntryNumber(ENTRY_NUMBER_PREFIXES.vendorDeposit, (entryNumber, transaction) =>
        vendorDeposits.create(
            {
                vendorId,
                entryNumber,
                amount,
                depositDate,
                reference,
                mode,
                note: note || null,
                status: "ACTIVE",
                entryType: ENTRY_TYPES.deposit,
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

const createOpeningBalance = ({ vendorId, amount, asOfDate, note, slip, actor }) =>
    withEntryNumber(ENTRY_NUMBER_PREFIXES.openingBalance, (entryNumber, transaction) =>
        vendorDeposits.create(
            {
                vendorId,
                entryNumber,
                amount,
                depositDate: asOfDate,
                reference: null,
                mode: "OTHER",
                note: note || null,
                status: "ACTIVE",
                entryType: ENTRY_TYPES.opening,
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
const reverseDeposit = ({ id, vendorId, reason, actor }) =>
    sequelizeConfig.transaction(async transaction => {
        const row = await vendorDeposits.findOne({ where: { id, vendorId }, transaction, lock: true });
        if (!row || row.status === "VOIDED" || row.entryType === ENTRY_TYPES.reversal) return null;

        const entryNumber = await nextEntryNumber(depositPrefixOf(row), transaction);
        const reversal = await vendorDeposits.create(
            {
                vendorId: row.vendorId,
                entryNumber,
                amount: row.amount,
                depositDate: new Date().toISOString().slice(0, 10),
                reference: row.reference,
                mode: row.mode,
                note: reason || null,
                status: "ACTIVE",
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

// The opening row itself is always counted: it carries the balance from before go-live and
// is dated on the floor, so it is admitted by entryType rather than by date.
const flooredWhere = (where, accountingFloor) => {
    if (!accountingFloor) return where;
    return {
        [Op.and]: [
            where,
            {
                [Op.or]: [
                    { entryType: ENTRY_TYPES.opening },
                    { depositDate: { [Op.gt]: accountingFloor } },
                ],
            },
        ],
    };
};

const sumActiveDeposits = async (vendorId, range, accountingFloor = null) => {
    const where = { vendorId };
    if (range) where.depositDate = { [Op.between]: [range.from, range.to] };

    const [row] = await vendorDeposits.findAll({
        attributes: [[NET_AMOUNT, "total"]],
        where: flooredWhere(where, accountingFloor),
        raw: true,
    });

    return round2(row && row.total);
};

const sumActiveDepositsByVendor = async (accountingFloor = null) => {
    const rows = await vendorDeposits.findAll({
        attributes: ["vendorId", [NET_AMOUNT, "total"]],
        where: flooredWhere({}, accountingFloor),
        group: ["vendorId"],
        raw: true,
    });

    const map = {};
    rows.forEach(row => {
        map[row.vendorId] = round2(row.total);
    });
    return map;
};

const sumDepositsInRange = async (range, accountingFloor = null) => {
    const [row] = await vendorDeposits.findAll({
        attributes: [[NET_AMOUNT, "total"]],
        where: flooredWhere(
            { depositDate: { [Op.between]: [range.from, range.to] } },
            accountingFloor
        ),
        raw: true,
    });

    return round2(row && row.total);
};

const listVendorsWithOpeningBalance = async () => {
    const rows = await vendorDeposits.findAll({
        attributes: ["vendorId"],
        where: { entryType: ENTRY_TYPES.opening, status: "ACTIVE" },
        raw: true,
    });

    return rows.map(row => row.vendorId);
};

const DEPOSIT_FIELDS = [
    ledgerChanges.field("amount", "amount", "amount"),
    ledgerChanges.field("depositDate", "date", "date"),
    ledgerChanges.field("reference", "reference", "text"),
    ledgerChanges.field("mode", "mode", "text"),
    ledgerChanges.field("note", "note", "text"),
];

const OPENING_FIELDS = [
    ledgerChanges.field("amount", "amount", "amount"),
    ledgerChanges.field("depositDate", "date", "date"),
    ledgerChanges.field("note", "note", "text"),
];

const changeTarget = ({ id, vendorId, entryType, audit }) => ({
    model: vendorDeposits,
    where: { id, vendorId, entryType },
    fields: entryType === ENTRY_TYPES.opening ? OPENING_FIELDS : DEPOSIT_FIELDS,
    audit: { ...audit, table: "vendorDeposits" },
});

const updateDeposit = ({ values, slip, actor, changeReason, ...target }) =>
    ledgerChanges.editEntry({ ...changeTarget(target), values, slip, actor, changeReason });

const deleteDeposit = ({ actor, changeReason, ...target }) =>
    ledgerChanges.deleteEntry({ ...changeTarget(target), actor, changeReason });

const tagDepositBooks = ({ id, vendorId, synced, actor, audit }) =>
    ledgerChanges.tagBooks({
        model: vendorDeposits,
        where: { id, vendorId },
        synced,
        actor,
        audit: { ...audit, table: "vendorDeposits" },
    });

const findFirstEntryDate = async vendorId => {
    const row = await vendorDeposits.findOne({
        attributes: ["depositDate"],
        where: { vendorId, entryType: { [Op.ne]: ENTRY_TYPES.opening } },
        order: [["depositDate", "ASC"]],
        raw: true,
    });
    return row ? row.depositDate : null;
};

module.exports = {
    DEPOSIT_MODES,
    ENTRY_TYPES,
    DEPOSIT_STATUS_FILTERS,
    serializeDeposit,
    listByVendor,
    findOpeningBalance,
    createDeposit,
    createOpeningBalance,
    reverseDeposit,
    updateDeposit,
    deleteDeposit,
    tagDepositBooks,
    findFirstEntryDate,
    sumActiveDeposits,
    sumActiveDepositsByVendor,
    sumDepositsInRange,
    listVendorsWithOpeningBalance,
};
