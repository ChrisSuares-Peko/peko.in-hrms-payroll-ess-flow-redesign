const sequelizeConfig = require("../../configs/database/index");
const { listAllByPartner } = require("./partnerPayouts");
const {
    ENTRY_KINDS: PARTNER_ENTRY_KINDS,
    listAllByPartner: listAllEntriesByPartner,
} = require("./partnerLedgerEntries");
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
const {
    JOURNAL_KEYS,
    UNANSWERED_STATUS,
    OPENING_FLOOR_JOIN,
    AFTER_FLOOR,
    getPartnershipPayableAccountId,
} = require("./partnerLedger");
const { loadAccountingFloor } = require("./accountingPeriod");

const PARTNER_STATEMENT_CONVENTION =
    "A credit is share the partner earned and raises what Peko owes. A debit is a payout or a debit note that settles it. The closing balance is what is still to be paid.";

const select = (sql, replacements = {}) =>
    sequelizeConfig.query(sql, { replacements, type: sequelizeConfig.QueryTypes.SELECT });

const eventDate = key =>
    `COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(orders.journalData, '$.${key}.journalDate')) AS DATE), DATE(orders.transactionDate))`;

const JOURNAL_LINES_TABLE = key => `CROSS JOIN JSON_TABLE(
                COALESCE(JSON_EXTRACT(orders.journalData, '$.${key}.lineItems'), JSON_ARRAY()),
                '$[*]' COLUMNS (
                    accountId VARCHAR(64) PATH '$.accountId',
                    direction VARCHAR(10) PATH '$.direction',
                    amount DECIMAL(16, 4) PATH '$.amount'
                )
            ) AS journalLines`;

const IS_PARTNER_CUSTOMER =
    "customer.registeredBy REGEXP '^[0-9]+$' AND CAST(customer.registeredBy AS UNSIGNED) <> customer.id";

// Every movement the journal posted against the partner's payable, one row per event and
// order, with the event date so a refund lands on the day it came back.
const buildAccrualQuery = () => {
    const selects = JOURNAL_KEYS.map(
        key => `SELECT '${key}' AS eventKey,
                ${eventDate(key)} AS entryDate,
                orders.id AS orderId,
                orders.corporateTxnId AS reference,
                serviceOperators.serviceProvider AS service,
                journalLines.direction AS direction,
                journalLines.amount AS amount,
                ${postingSelect(key, { prefix: "event" })}
            FROM orders
            INNER JOIN credentials customer ON customer.id = orders.credentialId
            LEFT JOIN serviceOperators ON serviceOperators.id = orders.serviceOperatorId
            ${JOURNAL_LINES_TABLE(key)}
            ${OPENING_FLOOR_JOIN}
            WHERE orders.journalData IS NOT NULL
                AND ${IS_PARTNER_CUSTOMER}
                AND customer.registeredBy = :partnerId
                AND journalLines.accountId = :payableAccountId
                AND ${reachedBooksSql(key)}
                AND ${AFTER_FLOOR(eventDate(key))}`
    );

    return `SELECT * FROM (${selects.join(" UNION ALL ")}) AS accruals ORDER BY entryDate ASC, orderId ASC`;
};

const fetchAccruals = async partnerId => {
    const payableAccountId = await getPartnershipPayableAccountId();
    if (!payableAccountId) return [];

    return select(buildAccrualQuery(), {
        partnerId: String(partnerId),
        payableAccountId,
        accountingFloor: await loadAccountingFloor(),
    });
};

const buildUnpostedAccrualQuery = () => {
    const selects = JOURNAL_KEYS.map(
        key => `SELECT '${key}' AS eventKey,
                ${eventDate(key)} AS entryDate,
                orders.id AS orderId,
                orders.corporateTxnId AS reference,
                serviceOperators.serviceProvider AS service,
                CONVERT(NULL USING utf8mb4) AS direction,
                NULL AS amount,
                ${postingSelect(key, { prefix: "event" })}
            FROM orders
            INNER JOIN credentials customer ON customer.id = orders.credentialId
            LEFT JOIN serviceOperators ON serviceOperators.id = orders.serviceOperatorId
            ${OPENING_FLOOR_JOIN}
            WHERE ${IS_PARTNER_CUSTOMER}
                AND customer.registeredBy = :partnerId
                AND orders.status <> '${UNANSWERED_STATUS}'
                AND ${notReachedBooksSql(key)}
                ${key === "transaction" ? "" : `AND JSON_EXTRACT(orders.journalData, '$.${key}') IS NOT NULL`}
                AND ${AFTER_FLOOR(eventDate(key))}`
    );

    return `SELECT * FROM (${selects.join(" UNION ALL ")}) AS unposted ORDER BY entryDate ASC, orderId ASC`;
};

const fetchUnpostedAccruals = async partnerId => {
    if (!(await getPartnershipPayableAccountId())) return [];

    return select(buildUnpostedAccrualQuery(), {
        partnerId: String(partnerId),
        accountingFloor: await loadAccountingFloor(),
    });
};

const ACCRUAL_LABELS = {
    transaction: "Earned",
    refund: "Refund",
    adminRefund: "Admin refund",
    cashback: "Cashback",
    cashbackReversal: "Cashback reversal",
};

const accrualLine = row => {
    const type = ACCRUAL_LABELS[row.eventKey] || "Accrued";
    return entryRow({
        date: row.entryDate,
        particulars: `${type} — ${row.service || "Partner order"}`,
        reference: row.reference,
        type,
        side: row.direction === "credit" ? CREDIT : DEBIT,
        amount: row.amount,
        posting: eventPostingOfRow(row),
    });
};

const payoutLine = row => {
    const isOpening = row.entryKind === "OPENING";
    const isReversal = row.entryType === "REVERSAL";
    const noun = isOpening ? "Opening balance" : `Payout — ${row.mode}`;

    return entryRow({
        date: dayOf(row.payoutDate),
        particulars: isReversal ? `${noun} reversed${row.note ? ` — ${row.note}` : ""}` : noun,
        reference: row.reference,
        entryNumber: row.entryNumber,
        type: isReversal ? "Reversal" : isOpening ? "Opening" : "Payout",
        // A payout settles the debt, so it is a debit. The opening runs the other way: it is
        // what Peko already owed before any of this was recorded.
        side: isOpening ? (isReversal ? DEBIT : CREDIT) : isReversal ? CREDIT : DEBIT,
        amount: row.amount,
    });
};

// A debit note takes back part of what the partner earned, so it settles what is owed the
// way a payout does, and its reversal puts the amount back.
const debitNoteLine = row => {
    const reversal = row.entryType === "REVERSAL";
    const title = "Debit note";

    return entryRow({
        date: dayOf(row.issueDate),
        particulars: reversal ? `Reversal — debit note ${row.reference}` : title,
        reference: null,
        entryNumber: row.entryNumber,
        type: reversal ? "Reversal" : "Debit note",
        side: reversal ? CREDIT : DEBIT,
        amount: row.amount,
    });
};

// Earning raises what Peko owes and a payout settles it, so a credit adds to the balance.
const signedOf = row => round2(toNumber(row.credit) - toNumber(row.debit));

const buildPartnerStatement = async ({ partnerId, range = null }) => {
    const [accruals, payouts, debitNotes, unposted] = await Promise.all([
        fetchAccruals(partnerId),
        listAllByPartner({ partnerCredentialId: partnerId, range: null }),
        listAllEntriesByPartner({
            partnerCredentialId: partnerId,
            kind: PARTNER_ENTRY_KINDS.debitNote,
            range: null,
        }),
        fetchUnpostedAccruals(partnerId),
    ]);

    // Only a payout closes a period. A reversal undoes one, so it is a balance event in the
    // sequence but it never becomes a settlement boundary.
    const sequence = [];

    // The opening is the line everything else sits on top of, so it leads the statement and
    // never closes a period of its own.
    payouts
        .filter(row => row.entryKind === "OPENING")
        .forEach(row => {
            sequence.push({
                date: dayOf(row.payoutDate),
                seq: row.entryType === "REVERSAL" ? 2 : -1,
                row: payoutLine(row),
            });
        });

    [...accruals, ...unposted].forEach(row =>
        sequence.push({
            date: dayOf(row.entryDate),
            seq: 0,
            row: accrualLine(row),
        })
    );

    payouts
        .filter(row => row.entryType !== "REVERSAL" && row.entryKind !== "OPENING")
        .forEach(row => {
            sequence.push({ date: dayOf(row.payoutDate), seq: 1, row: payoutLine(row) });
        });

    // A debit note settles like a payout, so it sits with the payouts of its day, after the
    // accruals of that day and before any reversal.
    debitNotes.forEach(row => {
        sequence.push({
            date: dayOf(row.issueDate),
            seq: row.entryType === "REVERSAL" ? 2 : 1,
            row: debitNoteLine(row),
        });
    });

    payouts
        .filter(row => row.entryType === "REVERSAL" && row.entryKind !== "OPENING")
        .forEach(row => {
            sequence.push({ date: dayOf(row.payoutDate), seq: 2, row: payoutLine(row) });
        });

    const rows = sequence
        .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.seq - b.seq))
        .map(item => item.row);

    const scoped = range
        ? rows.filter(row => row.date >= dayOf(range.from) && row.date <= dayOf(range.to))
        : rows;

    // A ranged view still opens from everything that came before it, so the running balance
    // never restarts at zero mid-history.
    const openingBalance = range
        ? rows
              .filter(row => row.date < dayOf(range.from))
              .reduce((sum, row) => round2(sum + signedOf(row)), 0)
        : 0;

    const tallied = tallyStatement({
        rows: scoped.slice(0, MAX_ROWS),
        openingBalance,
        signedOf,
    });

    return {
        openingBalance: round2(openingBalance),
        ...tallied,
        truncated: scoped.length > MAX_ROWS || accruals.length >= MAX_ROWS,
    };
};

module.exports = {
    PARTNER_STATEMENT_CONVENTION,
    buildAccrualQuery,
    buildUnpostedAccrualQuery,
    fetchAccruals,
    accrualLine,
    payoutLine,
    debitNoteLine,
    signedOf,
    buildPartnerStatement,
    statementExcelRows,
};
