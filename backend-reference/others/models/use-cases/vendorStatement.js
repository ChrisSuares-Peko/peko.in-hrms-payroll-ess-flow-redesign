const { Op } = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const vendorDeposits = require("../entities/vendorDeposit");
const vendorLedgerEntries = require("../entities/vendorLedgerEntry");
const {
    JOURNAL_KEYS,
    UNANSWERED_STATUS,
    vendorLedgerOrderClause,
    notMarkupSale,
} = require("./vendorLedger");
const { commissionModeSql } = require("./sellingMode");
const { loadAccountingFloor } = require("./accountingPeriod");
const { isVendorService } = require("./classifiedServices");
const {
    DEBIT,
    CREDIT,
    MAX_ROWS,
    toNumber,
    round2,
    dayOf,
    entryRow,
    tallyStatement,
    statementExcelRows,
} = require("./ledgerStatement");
const { postingSelect, eventPostingOfRow, reachedBooksSql, notReachedBooksSql } = require("./journalPosting");

const VENDOR_SERVICE = isVendorService();

// Peko prepays each vendor, so the balance is an advance held with them. A debit raises
// that advance and a credit consumes it, matching the journal the statement is
// reconciled against: a deposit debits Vendor Deposits, an order credits it.
const EVENT_LABELS = {
    transaction: "Order value",
    refund: "Refund",
    adminRefund: "Admin refund",
    cashback: "Cashback",
    cashbackReversal: "Cashback reversal",
};

const REFUND_KEYS = ["refund", "adminRefund"];

const OPENING_ENTRY_TYPE = "OPENING";

// journalDate is a 'YYYY-MM-DD' string inside the JSON, so it needs unquoting before it
// can be cast or compared. An event written before that field existed falls back to the
// order's own date rather than dropping out of every period.
const eventDate = key =>
    `COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(orders.journalData, '$.${key}.journalDate')) AS DATE), DATE(orders.transactionDate))`;

const jsonAmount = path =>
    `CAST(JSON_UNQUOTE(JSON_EXTRACT(orders.journalData, '$.${path}')) AS DECIMAL(16, 4))`;

const JOURNAL_LINES_TABLE = key => `CROSS JOIN JSON_TABLE(
                COALESCE(JSON_EXTRACT(orders.journalData, '$.${key}.lineItems'), JSON_ARRAY()),
                '$[*]' COLUMNS (
                    accountId VARCHAR(64) PATH '$.accountId',
                    direction VARCHAR(10) PATH '$.direction',
                    amount DECIMAL(16, 4) PATH '$.amount'
                )
            ) AS journalLines`;

const ORDER_FIGURES =
    `${jsonAmount("vendorPayable")} AS vendorPayable,
                ${jsonAmount("commissionExcludingGST")} AS commissionExcludingGST,
                ${jsonAmount("commissionIncludingGST")} AS commissionIncludingGST,
                ${jsonAmount("principalSalesPayable")} AS principalSalesPayable,
                ${commissionModeSql("serviceOperators")} AS commissionMode`;

// A sibling of buildVendorMovementQuery rather than a change to it: that one is a grouped
// sum whose SQL fragments are asserted in tests, this one returns a row per journal event.
const buildVendorStatementQuery = ({ range, floorDate }) => {
    const selects = JOURNAL_KEYS.map(key => {
        const where = [
            "orders.journalData IS NOT NULL",
            "serviceOperators.vendorId = :vendorId",
            VENDOR_SERVICE,
            notMarkupSale("serviceOperators"),
            "journalLines.accountId IN (:accountIds)",
            `${eventDate(key)} > :accountingFloor`,
            reachedBooksSql(key),
        ];
        if (range) where.push(`${eventDate(key)} BETWEEN :from AND :to`);
        if (floorDate) where.push(`${eventDate(key)} > :floorDate`);

        return `SELECT
                '${key}' AS eventKey,
                ${eventDate(key)} AS entryDate,
                orders.corporateTxnId AS reference,
                serviceOperators.serviceProvider AS service,
                journalLines.direction AS direction,
                journalLines.amount AS amount,
                ${postingSelect(key, { prefix: "event" })},
                ${ORDER_FIGURES}
            FROM orders
            INNER JOIN serviceOperators ON serviceOperators.id = orders.serviceOperatorId
            ${JOURNAL_LINES_TABLE(key)}
            WHERE ${where.join(" AND ")}`;
    });

    return `SELECT * FROM (${selects.join(" UNION ALL ")}) AS movements ORDER BY entryDate ASC, reference ASC`;
};

const fetchJournalRows = async ({ vendorId, accountIds, range, floorDate }) => {
    if (!accountIds || !accountIds.length) return [];

    const replacements = { vendorId, accountIds, accountingFloor: await loadAccountingFloor() };
    if (range) {
        replacements.from = dayOf(range.from);
        replacements.to = dayOf(range.to);
    }
    if (floorDate) replacements.floorDate = floorDate;

    return sequelizeConfig.query(buildVendorStatementQuery({ range, floorDate }), {
        replacements,
        type: sequelizeConfig.QueryTypes.SELECT,
    });
};

const buildVendorUnpostedQuery = ({ range, floorDate }) => {
    const selects = JOURNAL_KEYS.map(key => {
        const where = [
            "serviceOperators.vendorId = :vendorId",
            VENDOR_SERVICE,
            `orders.status <> '${UNANSWERED_STATUS}'`,
            vendorLedgerOrderClause(null),
            notMarkupSale("serviceOperators"),
            notReachedBooksSql(key),
            `${eventDate(key)} > :accountingFloor`,
        ];
        if (key !== "transaction") where.push(`JSON_EXTRACT(orders.journalData, '$.${key}') IS NOT NULL`);
        if (range) where.push(`${eventDate(key)} BETWEEN :from AND :to`);
        if (floorDate) where.push(`${eventDate(key)} > :floorDate`);

        return `SELECT
                '${key}' AS eventKey,
                ${eventDate(key)} AS entryDate,
                orders.corporateTxnId AS reference,
                serviceOperators.serviceProvider AS service,
                CONVERT(NULL USING utf8mb4) AS direction,
                NULL AS amount,
                ${postingSelect(key, { prefix: "event" })}
            FROM orders
            INNER JOIN serviceOperators ON serviceOperators.id = orders.serviceOperatorId
            WHERE ${where.join(" AND ")}`;
    });

    return `SELECT * FROM (${selects.join(" UNION ALL ")}) AS unposted ORDER BY entryDate ASC, reference ASC`;
};

const fetchUnpostedRows = async ({ vendorId, range, floorDate }) => {
    const replacements = { vendorId, accountingFloor: await loadAccountingFloor() };
    if (range) {
        replacements.from = dayOf(range.from);
        replacements.to = dayOf(range.to);
    }
    if (floorDate) replacements.floorDate = floorDate;

    return sequelizeConfig.query(buildVendorUnpostedQuery({ range, floorDate }), {
        replacements,
        type: sequelizeConfig.QueryTypes.SELECT,
    });
};

// The parts every order-shaped group is built from. `moved` is what reached the deposit
// account, so the components net back to it. Commission carries its own tax, as one figure
// rather than two lines. A sale on a markup basis never reaches the statement at all.
const partsOf = (row, moved, ratio) => {
    const commission = round2(toNumber(row.commissionIncludingGST) * ratio);
    return { commission, orderValue: round2(moved + commission) };
};

const splitOf = (row, moved) => {
    const receivable = round2(row.vendorPayable);
    return partsOf(row, moved, receivable ? moved / receivable : 0);
};

const wholeOrderOf = row => partsOf(row, round2(row.vendorPayable), 1);

const componentLines = (row, { side, labels, split, posting }) => {
    const lines = [];
    if (split.commission) {
        lines.push(
            entryRow({
                date: row.entryDate,
                particulars: labels.commission,
                reference: row.reference,
                type: "Commission",
                side,
                amount: split.commission,
                posting,
            })
        );
    }
    return lines;
};

// An order credits the vendor-side order value, then debits back Peko's commission, which
// did not come out of the advance. The lines net to what the order took from the advance:
// the receivable.
const orderLines = row => {
    const posting = eventPostingOfRow(row);
    const split = wholeOrderOf(row);

    return [
        entryRow({
            date: row.entryDate,
            particulars: `Order value — ${row.service || "Order"}`,
            reference: row.reference,
            type: "Order",
            side: CREDIT,
            amount: split.orderValue,
            posting,
        }),
        ...componentLines(row, {
            side: DEBIT,
            labels: { commission: "Commission" },
            split,
            posting,
        }),
    ];
};

// A refund is the order read backwards. The posted amount is the only figure the journal
// restates, so the components are scaled by how much of the receivable came back, which
// keeps a partial refund honest and still nets to what actually moved.
const refundLines = row => {
    const moved = round2(row.amount);
    const receivable = round2(row.vendorPayable);
    if (row.direction === CREDIT || !receivable || !moved) return [movementLine(row)];

    const posting = eventPostingOfRow(row);
    const split = splitOf(row, moved);
    const label = EVENT_LABELS[row.eventKey] || row.eventKey;

    return [
        entryRow({
            date: row.entryDate,
            particulars: `Order value reversed — ${row.service || "Order"}`,
            reference: row.reference,
            type: label,
            side: DEBIT,
            amount: split.orderValue,
            posting,
        }),
        ...componentLines(row, {
            side: CREDIT,
            labels: { commission: "Commission reversed" },
            split,
            posting,
        }),
    ];
};

// Anything the journal does not restate into parts stays the single amount that moved.
function movementLine(row) {
    return entryRow({
        date: row.entryDate,
        particulars: `${EVENT_LABELS[row.eventKey] || row.eventKey} — ${row.service || "Order"}`,
        reference: row.reference,
        type: EVENT_LABELS[row.eventKey] || row.eventKey,
        side: row.direction === CREDIT ? CREDIT : DEBIT,
        amount: row.amount,
        posting: eventPostingOfRow(row),
    });
}

const journalLines = rows =>
    rows.flatMap(row => {
        if (row.eventKey === "transaction") return orderLines(row);
        if (REFUND_KEYS.includes(row.eventKey)) return refundLines(row);
        return movementLine(row);
    });

const unpostedLine = row =>
    entryRow({
        date: row.entryDate,
        particulars: `${EVENT_LABELS[row.eventKey] || row.eventKey} — ${row.service || "Order"}`,
        reference: row.reference,
        type: row.eventKey === "transaction" ? "Order" : EVENT_LABELS[row.eventKey] || row.eventKey,
        side: row.eventKey === "transaction" ? CREDIT : DEBIT,
        amount: null,
        posting: eventPostingOfRow(row),
    });

const depositLine = row => {
    const opening = row.entryType === OPENING_ENTRY_TYPE;
    const reversal = row.entryType === "REVERSAL";

    return entryRow({
        date: row.depositDate,
        particulars: reversal
            ? `Reversal — ${row.note || "deposit"}`
            : opening
              ? "Opening balance"
              : `Deposit — ${row.mode || ""}`.trim(),
        reference: row.reference,
        entryNumber: row.entryNumber,
        type: opening ? "Opening" : reversal ? "Reversal" : "Deposit",
        side: reversal ? CREDIT : DEBIT,
        amount: row.amount,
    });
};

const ENTRY_NOUNS = {
    COMMISSION: "commission",
    COST_OF_SALES: "cost of sales",
    CREDIT_NOTE: "credit note",
    DEBIT_NOTE: "debit note",
};
const ENTRY_TYPES_SHOWN = {
    COMMISSION: "Commission",
    COST_OF_SALES: "Cost of sales",
    CREDIT_NOTE: "Credit note",
    DEBIT_NOTE: "Debit note",
};

// A commission charges the vendor and raises the advance, so it is a debit like a deposit. A
// credit note gives value back and consumes it, so it is a credit like an order, and a cost of
// sales recorded by hand is the mirror of a commission, so it is a credit as well; a debit note
// corrects a cost of sales, so it is a debit. A reversal is the same entry read the other way
// round.
const manualEntryLine = row => {
    const debit = row.kind === "COMMISSION" || row.kind === "DEBIT_NOTE";
    const noun = ENTRY_NOUNS[row.kind] || ENTRY_NOUNS.CREDIT_NOTE;
    const reversal = row.entryType === "REVERSAL";
    const title = `${noun.charAt(0).toUpperCase()}${noun.slice(1)}`;
    const side = debit ? DEBIT : CREDIT;

    return entryRow({
        date: row.issueDate,
        particulars: reversal ? `Reversal — ${noun} ${row.reference}` : title,
        reference: null,
        entryNumber: row.entryNumber,
        type: reversal ? "Reversal" : ENTRY_TYPES_SHOWN[row.kind] || ENTRY_TYPES_SHOWN.CREDIT_NOTE,
        side: reversal ? (side === DEBIT ? CREDIT : DEBIT) : side,
        amount: row.amount,
    });
};

const ledgerWhere = (vendorId, dateField, range, accountingFloor, extra = null) => {
    const where = { vendorId };
    if (range) where[dateField] = { [Op.between]: [dayOf(range.from), dayOf(range.to)] };
    if (!accountingFloor) return where;

    const floored = { [dateField]: { [Op.gt]: accountingFloor } };
    return { [Op.and]: [where, extra ? { [Op.or]: [extra, floored] } : floored] };
};

// No opening-date floor here: the controller already refuses a deposit or a manual entry
// dated on or before the opening balance, and the opening row itself must be included.
// Journal events carry no such guard, which is why only they are floored. The go-live floor
// does apply, except to the opening row, which is what everything else sits on.
const fetchLedgerRows = async ({ vendorId, range }) => {
    const accountingFloor = await loadAccountingFloor();
    const [deposits, entries] = await Promise.all([
        vendorDeposits.findAll({
            where: ledgerWhere(vendorId, "depositDate", range, accountingFloor, {
                entryType: OPENING_ENTRY_TYPE,
            }),
            order: [
                ["depositDate", "ASC"],
                ["id", "ASC"],
            ],
            limit: MAX_ROWS,
            raw: true,
        }),
        vendorLedgerEntries.findAll({
            where: ledgerWhere(vendorId, "issueDate", range, accountingFloor),
            order: [
                ["issueDate", "ASC"],
                ["id", "ASC"],
            ],
            limit: MAX_ROWS,
            raw: true,
        }),
    ]);

    return { deposits, entries };
};

const signedOf = row => round2(toNumber(row.debit) - toNumber(row.credit));

const sortKey = row => `${dayOf(row.date) || ""}|${row.reference || ""}`;

const allLines = (journalRows, ledger, unposted = []) => [
    ...journalLines(journalRows),
    ...unposted.map(unpostedLine),
    ...ledger.deposits.map(depositLine),
    ...ledger.entries.map(manualEntryLine),
];

// Everything strictly before the period start, collapsed into one figure.
const openingBalanceFor = async ({ vendorId, accountIds, before, floorDate }) => {
    if (!before) return 0;

    const priorRange = { from: "1970-01-01", to: before };
    const [journalRows, ledger] = await Promise.all([
        fetchJournalRows({ vendorId, accountIds, range: priorRange, floorDate }),
        fetchLedgerRows({ vendorId, range: priorRange, floorDate }),
    ]);

    return round2(
        allLines(journalRows, ledger).reduce((total, row) => total + signedOf(row), 0)
    );
};

const hitTheCap = (journalRows, ledger) =>
    journalRows.length >= MAX_ROWS ||
    ledger.deposits.length >= MAX_ROWS ||
    ledger.entries.length >= MAX_ROWS;

const dayBefore = value => {
    const date = new Date(`${dayOf(value)}T00:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() - 1);
    return date.toISOString().slice(0, 10);
};

const buildVendorStatement = async ({ vendorId, accountIds, range, openingAsOf = null }) => {
    // The opening figure already contains everything up to its own date, so anything
    // dated on or before it would otherwise be counted twice.
    const floorDate = openingAsOf ? dayOf(openingAsOf) : null;

    const [openingBalance, journalRows, ledger, unposted] = await Promise.all([
        range
            ? openingBalanceFor({
                  vendorId,
                  accountIds,
                  before: dayBefore(range.from),
                  floorDate,
              })
            : 0,
        fetchJournalRows({ vendorId, accountIds, range, floorDate }),
        fetchLedgerRows({ vendorId, range }),
        fetchUnpostedRows({ vendorId, range, floorDate }),
    ]);

    const merged = allLines(journalRows, ledger, unposted).sort((a, b) =>
        sortKey(a) < sortKey(b) ? -1 : sortKey(a) > sortKey(b) ? 1 : 0
    );

    const tallied = tallyStatement({
        rows: merged.slice(0, MAX_ROWS),
        openingBalance,
        signedOf,
    });

    return {
        openingBalance: round2(openingBalance),
        ...tallied,
        truncated: merged.length > MAX_ROWS || hitTheCap(journalRows, ledger),
    };
};

module.exports = {
    MAX_ROWS,
    EVENT_LABELS,
    REFUND_KEYS,
    statementExcelRows,
    buildVendorStatementQuery,
    splitOf,
    wholeOrderOf,
    orderLines,
    refundLines,
    movementLine,
    depositLine,
    manualEntryLine,
    journalLines,
    buildVendorUnpostedQuery,
    unpostedLine,
    buildVendorStatement,
};
