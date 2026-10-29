const { Op, literal } = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const partnerPayouts = require("../entities/partnerPayout");
const { NOT_APPLICABLE } = require("./journalPosting");
const ledgerChanges = require("./ledgerEntryChanges");
const { currentIp } = require("../../utils/requestContext");
const { ENTRY_NUMBER_PREFIXES, nextEntryNumber, withEntryNumber } = require("./entryNumbers");

const PAYOUT_MODES = ["NEFT", "RTGS", "IMPS", "UPI", "CHEQUE", "OTHER"];

const ENTRY_TYPES = { payout: "PAYOUT", reversal: "REVERSAL" };

// OPENING is the position carried in from before the portal started recording. It is the
// opposite side from a payout, so it is its own kind and every "paid" sum must exclude it.
const ENTRY_KINDS = { payout: "PAYOUT", opening: "OPENING" };

// A reversal keeps its own positive amount and is subtracted here, so the original row is
// never rewritten and any past balance stays reproducible.
const NET_AMOUNT = literal(
    "COALESCE(SUM(CASE WHEN entryType = 'REVERSAL' THEN -amount ELSE amount END), 0)"
);

const toNumber = value => Number(value) || 0;

const round2 = value => Math.round((toNumber(value) + Number.EPSILON) * 100) / 100;

const serializePayout = row => {
    const plain = row && typeof row.get === "function" ? row.get({ plain: true }) : row;
    const calculated = plain.calculatedAmount === null || plain.calculatedAmount === undefined
        ? null
        : round2(plain.calculatedAmount);
    const amount = round2(plain.amount);

    return {
        id: plain.id,
        partnerCredentialId: plain.partnerCredentialId,
        entryNumber: plain.entryNumber || null,
        amount,
        calculatedAmount: calculated,
        // What the accounts team changed the suggestion by, so the list can show it without
        // every caller redoing the subtraction.
        difference: calculated === null ? null : round2(amount - calculated),
        payoutDate: plain.payoutDate,
        reference: plain.reference,
        mode: plain.mode,
        note: plain.note,
        status: plain.status,
        posting: NOT_APPLICABLE,
        entryKind: plain.entryKind || ENTRY_KINDS.payout,
        entryType: plain.entryType || ENTRY_TYPES.payout,
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

const scopedWhere = (partnerCredentialId, range, entryKind) => {
    const where = { partnerCredentialId };
    if (entryKind) where.entryKind = entryKind;
    if (range) where.payoutDate = { [Op.between]: [range.from, range.to] };
    return where;
};

// What the Status pill reads on a payment row: a reversal first, then a voided one, then the
// opening, and anything else is a payout that was paid.
const PAYOUT_STATUS_FILTERS = {
    paid: {
        entryType: { [Op.ne]: ENTRY_TYPES.reversal },
        status: { [Op.ne]: "VOIDED" },
        entryKind: ENTRY_KINDS.payout,
        deletedAt: null,
    },
    opening: {
        entryType: { [Op.ne]: ENTRY_TYPES.reversal },
        status: { [Op.ne]: "VOIDED" },
        entryKind: ENTRY_KINDS.opening,
        deletedAt: null,
    },
    reversal: { entryType: ENTRY_TYPES.reversal, deletedAt: null },
    reversed: { entryType: { [Op.ne]: ENTRY_TYPES.reversal }, status: "VOIDED", deletedAt: null },
    deleted: { deletedAt: { [Op.ne]: null } },
};

const listByPartner = async ({
    partnerCredentialId,
    range,
    searchText,
    status,
    mode,
    limit,
    offset,
}) => {
    const where = scopedWhere(partnerCredentialId, range);
    if (Object.hasOwn(PAYOUT_STATUS_FILTERS, status)) Object.assign(where, PAYOUT_STATUS_FILTERS[status]);
    if (PAYOUT_MODES.includes(mode)) where.mode = mode;
    if (searchText) {
        const like = { [Op.like]: `%${searchText}%` };
        where[Op.or] = [{ entryNumber: like }, { reference: like }, { note: like }, { recordedByName: like }];
    }

    return partnerPayouts.findAndCountAll({
        where,
        paranoid: false,
        order: [
            ["payoutDate", "DESC"],
            ["id", "DESC"],
        ],
        limit,
        offset,
    });
};

const listAllByPartner = async ({ partnerCredentialId, range }) =>
    partnerPayouts.findAll({
        where: scopedWhere(partnerCredentialId, range),
        order: [
            ["payoutDate", "ASC"],
            ["id", "ASC"],
        ],
        raw: true,
    });

const payoutPrefixOf = row =>
    row.entryKind === ENTRY_KINDS.opening
        ? ENTRY_NUMBER_PREFIXES.openingBalance
        : ENTRY_NUMBER_PREFIXES.partnerPayout;

const createPayout = ({
    partnerCredentialId,
    amount,
    calculatedAmount,
    payoutDate,
    reference,
    mode,
    note,
    slip,
    actor,
}) =>
    withEntryNumber(ENTRY_NUMBER_PREFIXES.partnerPayout, (entryNumber, transaction) =>
        partnerPayouts.create(
            {
                partnerCredentialId,
                entryNumber,
                amount,
                calculatedAmount: calculatedAmount === undefined ? null : calculatedAmount,
                payoutDate,
                reference: reference || null,
                mode,
                note: note || null,
                status: "ACTIVE",
                entryKind: ENTRY_KINDS.payout,
                entryType: ENTRY_TYPES.payout,
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
const reversePayout = ({ id, partnerCredentialId, reason, actor }) =>
    sequelizeConfig.transaction(async transaction => {
        const row = await partnerPayouts.findOne({ where: { id, partnerCredentialId }, transaction, lock: true });
        if (!row || row.status === "VOIDED" || row.entryType === ENTRY_TYPES.reversal) return null;

        const entryNumber = await nextEntryNumber(payoutPrefixOf(row), transaction);
        const reversal = await partnerPayouts.create(
            {
                partnerCredentialId: row.partnerCredentialId,
                entryNumber,
                amount: row.amount,
                calculatedAmount: row.calculatedAmount,
                payoutDate: new Date().toISOString().slice(0, 10),
                reference: row.reference,
                mode: row.mode,
                note: reason || null,
                status: "ACTIVE",
                // The contra keeps its original's kind, so reversing an opening never reads as a
                // reversed payout and vice versa.
                entryKind: row.entryKind || ENTRY_KINDS.payout,
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

// Every "paid" sum is scoped to the payout kind. An opening is what Peko still owed before
// any of this was recorded, so counting it here would read as money already handed over.
const sumPaidToPartner = async (partnerCredentialId, range) => {
    const [row] = await partnerPayouts.findAll({
        attributes: [[NET_AMOUNT, "total"]],
        where: scopedWhere(partnerCredentialId, range, ENTRY_KINDS.payout),
        raw: true,
    });

    return round2(row && row.total);
};

// Never scoped to a range: the opening is the position everything else is measured from, so
// a date filter must not make it disappear and leave the balance short by it.
const sumOpeningForPartner = async partnerCredentialId => {
    const [row] = await partnerPayouts.findAll({
        attributes: [[NET_AMOUNT, "total"]],
        where: scopedWhere(partnerCredentialId, null, ENTRY_KINDS.opening),
        raw: true,
    });

    return round2(row && row.total);
};

const sumByPartnerAndKind = async () => {
    const rows = await partnerPayouts.findAll({
        attributes: ["partnerCredentialId", "entryKind", [NET_AMOUNT, "total"]],
        group: ["partnerCredentialId", "entryKind"],
        raw: true,
    });

    const map = {};
    rows.forEach(row => {
        const bucket = map[row.partnerCredentialId] || { paid: 0, opening: 0 };
        if (row.entryKind === ENTRY_KINDS.opening) bucket.opening = round2(row.total);
        else bucket.paid = round2(row.total);
        map[row.partnerCredentialId] = bucket;
    });
    return map;
};

const sumPaidByPartner = async () => {
    const rows = await partnerPayouts.findAll({
        attributes: ["partnerCredentialId", [NET_AMOUNT, "total"]],
        where: { entryKind: ENTRY_KINDS.payout },
        group: ["partnerCredentialId"],
        raw: true,
    });

    const map = {};
    rows.forEach(row => {
        map[row.partnerCredentialId] = round2(row.total);
    });
    return map;
};

const sumPaidInRange = async range => {
    const [row] = await partnerPayouts.findAll({
        attributes: [[NET_AMOUNT, "total"]],
        where: {
            entryKind: ENTRY_KINDS.payout,
            payoutDate: { [Op.between]: [range.from, range.to] },
        },
        raw: true,
    });

    return round2(row && row.total);
};

// The position carried in from before the portal started recording. It has no payout behind
// it, so it carries no reference and no mode of its own.
const createOpeningBalance = ({ partnerCredentialId, amount, asOfDate, note, slip, actor }) =>
    withEntryNumber(ENTRY_NUMBER_PREFIXES.openingBalance, (entryNumber, transaction) =>
        partnerPayouts.create(
            {
                partnerCredentialId,
                entryNumber,
                amount,
                calculatedAmount: null,
                payoutDate: asOfDate,
                reference: null,
                mode: "OTHER",
                note: note || null,
                status: "ACTIVE",
                entryKind: ENTRY_KINDS.opening,
                entryType: ENTRY_TYPES.payout,
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

const findOpeningBalance = async partnerCredentialId =>
    partnerPayouts.findOne({
        where: {
            partnerCredentialId,
            entryKind: ENTRY_KINDS.opening,
            entryType: ENTRY_TYPES.payout,
            status: "ACTIVE",
        },
        raw: true,
    });

const listPartnersWithOpening = async () => {
    const rows = await partnerPayouts.findAll({
        attributes: ["partnerCredentialId", "payoutDate"],
        where: {
            entryKind: ENTRY_KINDS.opening,
            entryType: ENTRY_TYPES.payout,
            status: "ACTIVE",
        },
        raw: true,
    });

    const map = {};
    rows.forEach(row => {
        map[row.partnerCredentialId] = row.payoutDate;
    });
    return map;
};

// The date the last live payout covered, which is what the Payments card names and what the
// statement uses to close its final group.
const findLastPayout = async partnerCredentialId =>
    partnerPayouts.findOne({
        where: {
            partnerCredentialId,
            status: "ACTIVE",
            entryKind: ENTRY_KINDS.payout,
            entryType: ENTRY_TYPES.payout,
        },
        order: [
            ["payoutDate", "DESC"],
            ["id", "DESC"],
        ],
        raw: true,
    });

const countPartnersPaidInRange = async range =>
    partnerPayouts.count({
        where: {
            status: "ACTIVE",
            entryKind: ENTRY_KINDS.payout,
            entryType: ENTRY_TYPES.payout,
            payoutDate: { [Op.between]: [range.from, range.to] },
        },
        distinct: true,
        col: "partnerCredentialId",
    });

const PAYOUT_FIELDS = [
    ledgerChanges.field("amount", "amount", "amount"),
    ledgerChanges.field("payoutDate", "date", "date"),
    ledgerChanges.field("reference", "reference", "text"),
    ledgerChanges.field("mode", "mode", "text"),
    ledgerChanges.field("note", "note", "text"),
];

const OPENING_FIELDS = [
    ledgerChanges.field("amount", "amount", "amount"),
    ledgerChanges.field("payoutDate", "date", "date"),
    ledgerChanges.field("note", "note", "text"),
];

const changeTarget = ({ id, partnerCredentialId, entryKind, audit }) => ({
    model: partnerPayouts,
    where: { id, partnerCredentialId, entryKind },
    fields: entryKind === ENTRY_KINDS.opening ? OPENING_FIELDS : PAYOUT_FIELDS,
    audit: { ...audit, table: "partnerPayouts" },
});

const updatePayout = ({ values, slip, actor, changeReason, ...target }) =>
    ledgerChanges.editEntry({ ...changeTarget(target), values, slip, actor, changeReason });

const deletePayout = ({ actor, changeReason, ...target }) =>
    ledgerChanges.deleteEntry({ ...changeTarget(target), actor, changeReason });

const tagPayoutBooks = ({ id, partnerCredentialId, synced, actor, audit }) =>
    ledgerChanges.tagBooks({
        model: partnerPayouts,
        where: { id, partnerCredentialId },
        synced,
        actor,
        audit: { ...audit, table: "partnerPayouts" },
    });

const findFirstPayoutDate = async partnerCredentialId => {
    const row = await partnerPayouts.findOne({
        attributes: ["payoutDate"],
        where: { partnerCredentialId, entryKind: ENTRY_KINDS.payout },
        order: [["payoutDate", "ASC"]],
        raw: true,
    });
    return row ? row.payoutDate : null;
};

module.exports = {
    PAYOUT_MODES,
    ENTRY_TYPES,
    ENTRY_KINDS,
    PAYOUT_STATUS_FILTERS,
    serializePayout,
    listByPartner,
    listAllByPartner,
    createPayout,
    createOpeningBalance,
    findOpeningBalance,
    listPartnersWithOpening,
    reversePayout,
    updatePayout,
    deletePayout,
    tagPayoutBooks,
    findFirstPayoutDate,
    sumPaidToPartner,
    sumOpeningForPartner,
    sumByPartnerAndKind,
    sumPaidByPartner,
    sumPaidInRange,
    findLastPayout,
    countPartnersPaidInRange,
};
