const { NOT_APPLICABLE, postingLabel } = require("./journalPosting");
const { istDay } = require("../../utils/istRange");

const DEBIT = "debit";
const CREDIT = "credit";

const MAX_ROWS = 5000;

const toNumber = value => Number(value) || 0;

const round2 = value => Math.round((toNumber(value) + Number.EPSILON) * 100) / 100;

const isPresent = value => value !== undefined && value !== null;

// A figure the journal never derived is null, never 0: the screen shows a dash for it.
const money = value => (isPresent(value) ? round2(value) : null);

const dayOf = value => {
    if (!value) return null;
    if (value instanceof Date) return istDay(value);
    return String(value).slice(0, 10);
};

const entryRow = ({ date, particulars, reference, entryNumber, type, side, amount, posting }) => ({
    date,
    particulars,
    reference: reference || null,
    entryNumber: entryNumber || null,
    type,
    debit: side === DEBIT ? money(amount) : null,
    credit: side === CREDIT ? money(amount) : null,
    posting: posting || NOT_APPLICABLE,
});

const tallyStatement = ({ rows, openingBalance, signedOf }) => {
    let running = round2(openingBalance);
    let totalDebit = 0;
    let totalCredit = 0;

    const tallied = rows.map(row => {
        totalDebit = round2(totalDebit + toNumber(row.debit));
        totalCredit = round2(totalCredit + toNumber(row.credit));
        running = round2(running + signedOf(row));
        return { ...row, date: dayOf(row.date), balance: running };
    });

    return { rows: tallied, totalDebit, totalCredit, closingBalance: running };
};

// Amounts stay numbers so the accounts team can sum and filter them in Excel. The opening
// and closing lines are rows, not a detached footer, so they survive the export.
const statementExcelRows = (statement, partyName, partyLabel = "Vendor", { markers = true } = {}) => {
    const lines = statement.rows.map(row => ({
        Date: row.date || "",
        Particulars: row.particulars,
        Reference: row.reference || "",
        "Entry No.": row.entryNumber || "",
        Type: row.type,
        [partyLabel]: partyName || "",
        Debit: row.debit === null ? "" : row.debit,
        Credit: row.credit === null ? "" : row.credit,
        Balance: row.balance,
        Posted: postingLabel(row.posting),
    }));

    return markers ? withMarkerLines(lines, statement, partyName, partyLabel) : lines;
};

const withMarkerLines = (lines, statement, partyName, partyLabel) => [
    {
        Date: "",
        Particulars: "Opening balance",
        Reference: "",
        "Entry No.": "",
        Type: "Opening",
        [partyLabel]: partyName || "",
        Debit: "",
        Credit: "",
        Balance: statement.openingBalance,
        Posted: "",
    },
    ...lines,
    {
        Date: "",
        Particulars: "Closing balance",
        Reference: "",
        "Entry No.": "",
        Type: "Closing",
        [partyLabel]: partyName || "",
        Debit: statement.totalDebit,
        Credit: statement.totalCredit,
        Balance: statement.closingBalance,
        Posted: "",
    },
];

module.exports = {
    DEBIT,
    CREDIT,
    MAX_ROWS,
    toNumber,
    round2,
    isPresent,
    money,
    dayOf,
    entryRow,
    tallyStatement,
    statementExcelRows,
};
