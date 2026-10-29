const { Op } = require("sequelize");
const vendorDeposits = require("../entities/vendorDeposit");
const vendorLedgerEntries = require("../entities/vendorLedgerEntry");
const partnerPayouts = require("../entities/partnerPayout");
const partnerLedgerEntries = require("../entities/partnerLedgerEntry");
const paymentGatewaySettlements = require("../entities/paymentGatewaySettlement");
const vendor = require("../entities/vendor");
const credential = require("../entities/credential");
const chartOfAccount = require("../entities/chartOfAccount");

const LEDGER_ENTRY_MODELS = [
    { ledger: "vendors", model: vendorDeposits },
    { ledger: "vendors", model: vendorLedgerEntries },
    { ledger: "partners", model: partnerPayouts },
    { ledger: "partners", model: partnerLedgerEntries },
    { ledger: "gateways", model: paymentGatewaySettlements },
];

const countOf = async (model, where) => Number(await model.count({ where, paranoid: false })) || 0;

const countEntriesNotInBooks = async () => {
    const counted = await Promise.all(
        LEDGER_ENTRY_MODELS.map(async ({ ledger, model }) => ({
            ledger,
            notSynced: await countOf(model, { booksSynced: false }),
            deleted: await countOf(model, { booksSynced: false, deletedAt: { [Op.ne]: null } }),
        }))
    );
    const totals = { vendors: 0, partners: 0, gateways: 0, deleted: 0 };
    counted.forEach(({ ledger, notSynced, deleted }) => {
        totals[ledger] += notSynced;
        totals.deleted += deleted;
    });
    return { ...totals, total: totals.vendors + totals.partners + totals.gateways };
};

const toNumber = value => Number(value) || 0;

const dateOf = value => {
    if (!value) return null;
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    return String(value).slice(0, 10);
};

const vendorNameOf = row => (row.vendor && row.vendor.vendorName) || null;
const partnerNameOf = row => (row.credential && row.credential.name) || null;

const ENTRY_READERS = [
    {
        model: vendorDeposits,
        ledger: "vendors",
        attributes: ["id", "amount", "depositDate", "entryType", "deletedAt", "vendorId"],
        include: [{ model: vendor, attributes: ["id", "vendorName"], required: false }],
        read: row => ({
            entryKind: row.entryType === "OPENING" ? "opening" : "deposit",
            profileId: row.vendorId,
            profileName: vendorNameOf(row),
            amount: toNumber(row.amount),
            date: dateOf(row.depositDate),
        }),
    },
    {
        model: vendorLedgerEntries,
        ledger: "vendors",
        attributes: ["id", "kind", "amount", "issueDate", "deletedAt", "vendorId"],
        include: [{ model: vendor, attributes: ["id", "vendorName"], required: false }],
        read: row => ({
            entryKind:
                row.kind === "COMMISSION"
                    ? "commission"
                    : row.kind === "COST_OF_SALES"
                      ? "cost_of_sales"
                      : row.kind === "DEBIT_NOTE"
                        ? "debit_note"
                        : "credit_note",
            profileId: row.vendorId,
            profileName: vendorNameOf(row),
            amount: toNumber(row.amount),
            date: dateOf(row.issueDate),
        }),
    },
    {
        model: partnerPayouts,
        ledger: "partners",
        attributes: ["id", "amount", "payoutDate", "entryKind", "deletedAt", "partnerCredentialId"],
        include: [{ model: credential, attributes: ["id", "name"], required: false }],
        read: row => ({
            entryKind: row.entryKind === "OPENING" ? "opening" : "payout",
            profileId: row.partnerCredentialId,
            profileName: partnerNameOf(row),
            amount: toNumber(row.amount),
            date: dateOf(row.payoutDate),
        }),
    },
    {
        model: partnerLedgerEntries,
        ledger: "partners",
        attributes: ["id", "kind", "amount", "issueDate", "deletedAt", "partnerCredentialId"],
        include: [{ model: credential, attributes: ["id", "name"], required: false }],
        read: row => ({
            entryKind: "debit_note",
            profileId: row.partnerCredentialId,
            profileName: partnerNameOf(row),
            amount: toNumber(row.amount),
            date: dateOf(row.issueDate),
        }),
    },
    {
        model: paymentGatewaySettlements,
        ledger: "gateways",
        attributes: ["id", "amount", "entryDate", "entryKind", "deletedAt", "gatewayAccountId"],
        read: row => ({
            entryKind: { RECEIPT: "receipt", FEE: "fee", OPENING: "opening" }[row.entryKind] || "receipt",
            profileId: row.gatewayAccountId,
            profileName: null,
            amount: toNumber(row.amount),
            date: dateOf(row.entryDate),
        }),
    },
];

const gatewayNamesOf = async entries => {
    const ids = [...new Set(entries.filter(entry => entry.ledger === "gateways").map(entry => entry.profileId))];
    if (!ids.length) return new Map();
    const rows = await chartOfAccount.findAll({
        where: { provider_account_id: { [Op.in]: ids } },
        attributes: ["provider_account_id", "account_name"],
        raw: true,
    });
    return new Map(rows.map(row => [String(row.provider_account_id), row.account_name]));
};

const listEntriesNotInBooks = async (limit = 50) => {
    const lists = await Promise.all(
        ENTRY_READERS.map(async reader => {
            const rows = await reader.model.findAll({
                where: { booksSynced: false },
                attributes: reader.attributes,
                include: reader.include || [],
                order: [["id", "DESC"]],
                limit,
                paranoid: false,
                raw: true,
                nest: true,
            });
            return (rows || []).map(row => ({
                id: row.id,
                ledger: reader.ledger,
                deleted: Boolean(row.deletedAt),
                ...reader.read(row),
            }));
        })
    );
    const entries = lists
        .flat()
        .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")) || b.id - a.id)
        .slice(0, limit);
    const gatewayNames = await gatewayNamesOf(entries);
    return entries.map(entry =>
        entry.ledger === "gateways"
            ? { ...entry, profileName: gatewayNames.get(String(entry.profileId)) || entry.profileName }
            : entry
    );
};

module.exports = { LEDGER_ENTRY_MODELS, countEntriesNotInBooks, listEntriesNotInBooks };
