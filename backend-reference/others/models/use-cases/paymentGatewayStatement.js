const sequelizeConfig = require("../../configs/database/index");
const { listAllByGateway, ENTRY_KINDS, ENTRY_TYPES } = require("./paymentGatewaySettlements");
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
    GATEWAY_OF_ORDER,
    EFFECTIVE_GATEWAY_OF_ORDER,
    EFFECTIVE_GATEWAY_MATCH,
    GATEWAY_AMOUNT_OF_ORDER,
    LISTED_ORDER_FROM,
    OPENING_FLOOR_JOIN,
    AFTER_FLOOR,
    ORDER_SOURCE,
} = require("./paymentGatewayLedger");
const { loadAccountingFloor } = require("./accountingPeriod");

const PAYMENT_GATEWAY_STATEMENT_CONVENTION =
    "A debit is money the gateway took in and owes Peko. A credit is money it handed over, or kept as its charge. The closing balance is what is still to come.";

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

// Every movement the journal posted against the gateway's own account, one row per event
// with the date the event carried so a refund lands on the day it went back.
// The opening figure already contains everything up to its own date, so anything dated on
// or before it would otherwise be counted twice.
const buildCollectionQuery = () => {
    const selects = JOURNAL_KEYS.map(
        key => `SELECT '${key}' AS eventKey,
                ${eventDate(key)} AS entryDate,
                orders.id AS orderId,
                orders.corporateTxnId AS reference,
                journalLines.direction AS direction,
                journalLines.amount AS amount,
                ${postingSelect(key, { prefix: "event" })}
            FROM orders
            ${JOURNAL_LINES_TABLE(key)}
            ${OPENING_FLOOR_JOIN} ON openingFloor.gatewayAccountId = CONVERT(journalLines.accountId USING utf8mb4)
            WHERE orders.journalData IS NOT NULL
                AND orders.status <> '${UNANSWERED_STATUS}'
                AND ${GATEWAY_OF_ORDER} = :gatewayAccountId
                AND journalLines.accountId = :gatewayAccountId
                AND ${reachedBooksSql(key)}
                AND ${AFTER_FLOOR(eventDate(key))}`
    );

    return `SELECT * FROM (${selects.join(" UNION ALL ")}) AS collections ORDER BY entryDate ASC, orderId ASC`;
};

const fetchCollections = async gatewayAccountId =>
    select(buildCollectionQuery(), {
        gatewayAccountId: String(gatewayAccountId),
        accountingFloor: await loadAccountingFloor(),
    });

const buildUnpostedCollectionQuery = () => {
    const selects = JOURNAL_KEYS.map(
        key => `SELECT '${key}' AS eventKey,
                ${eventDate(key)} AS entryDate,
                orders.id AS orderId,
                orders.corporateTxnId AS reference,
                CONVERT(NULL USING utf8mb4) AS direction,
                NULL AS amount,
                ${postingSelect(key, { prefix: "event" })}
            ${LISTED_ORDER_FROM}
            ${OPENING_FLOOR_JOIN} ON openingFloor.gatewayAccountId = ${EFFECTIVE_GATEWAY_OF_ORDER}
            WHERE ${ORDER_SOURCE}
                AND orders.status <> '${UNANSWERED_STATUS}'
                ${key === "transaction" ? "" : `AND JSON_EXTRACT(orders.journalData, '$.${key}') IS NOT NULL`}
                AND ${notReachedBooksSql(key)}
                AND ${EFFECTIVE_GATEWAY_MATCH}
                AND COALESCE(${GATEWAY_AMOUNT_OF_ORDER}, 0) > 0
                AND ${AFTER_FLOOR(eventDate(key))}`
    );

    return `SELECT * FROM (${selects.join(" UNION ALL ")}) AS unposted ORDER BY entryDate ASC, orderId ASC`;
};

const fetchUnpostedCollections = async gatewayAccountId =>
    select(buildUnpostedCollectionQuery(), {
        gatewayAccountId: String(gatewayAccountId),
        accountingFloor: await loadAccountingFloor(),
    });

const COLLECTION_LABELS = {
    transaction: "Collected",
    refund: "Refund",
    adminRefund: "Admin refund",
    cashback: "Cashback",
    cashbackReversal: "Cashback reversal",
};

const collectionLine = row => {
    const type = COLLECTION_LABELS[row.eventKey] || "Collection";
    return entryRow({
        date: row.entryDate,
        particulars: `${type} — ${row.reference || "Gateway transaction"}`,
        reference: row.reference,
        type,
        side: row.direction === "debit" ? DEBIT : CREDIT,
        amount: row.amount,
        posting: eventPostingOfRow(row),
    });
};

const settlementLine = row => {
    const isFee = row.entryKind === ENTRY_KINDS.fee;
    const isOpening = row.entryKind === ENTRY_KINDS.opening;
    const isReversal = row.entryType === ENTRY_TYPES.reversal;
    const noun = isOpening ? "Opening balance" : isFee ? "Gateway charges" : `Received — ${row.mode}`;

    return entryRow({
        date: dayOf(row.entryDate),
        particulars: isReversal ? `${noun} reversed${row.note ? ` — ${row.note}` : ""}` : noun,
        reference: row.reference,
        entryNumber: row.entryNumber,
        type: isReversal ? "Reversal" : isOpening ? "Opening" : isFee ? "Fee" : "Received",
        // Both settlement legs reduce the receivable, so both are credits and a reversal puts
        // it back. The opening runs the other way: it is what the gateway already owed.
        side: isOpening ? (isReversal ? CREDIT : DEBIT) : isReversal ? DEBIT : CREDIT,
        amount: row.amount,
    });
};

// A receipt raises no balance of its own, so the debit side is the collections and both
// settlement legs are credits. A reversal is a debit that restores what it undid.
const signedOf = row => round2(toNumber(row.debit) - toNumber(row.credit));

const buildPaymentGatewayStatement = async ({ gatewayAccountId, range = null }) => {
    const [collections, settlements, unposted] = await Promise.all([
        fetchCollections(gatewayAccountId),
        listAllByGateway({ gatewayAccountId, range: null }),
        fetchUnpostedCollections(gatewayAccountId),
    ]);

    // Only a live receipt closes a period. A reversal undoes one, so it is a balance event
    // in the sequence but it never becomes a settlement boundary.
    const sequence = [];

    // The opening is the line everything else sits on top of, so it leads the statement and
    // never closes a period of its own.
    settlements
        .filter(row => row.entryKind === ENTRY_KINDS.opening)
        .forEach(row => {
            sequence.push({
                date: dayOf(row.entryDate),
                seq: row.entryType === ENTRY_TYPES.reversal ? 3 : -1,
                row: settlementLine(row),
            });
        });

    const receipts = settlements.filter(
        row => row.entryKind === ENTRY_KINDS.receipt && row.entryType !== ENTRY_TYPES.reversal
    );
    const receiptKeys = new Set(receipts.map(row => String(row.settlementId || row.id)));
    const feesBySettlement = {};
    const standaloneFees = [];
    settlements
        .filter(row => row.entryKind === ENTRY_KINDS.fee && row.entryType !== ENTRY_TYPES.reversal)
        .forEach(row => {
            if (row.settlementId && receiptKeys.has(String(row.settlementId))) {
                feesBySettlement[row.settlementId] = row;
            } else {
                standaloneFees.push(row);
            }
        });

    [...collections, ...unposted].forEach(row =>
        sequence.push({
            date: dayOf(row.entryDate),
            seq: 0,
            row: collectionLine(row),
        })
    );

    receipts.forEach(receipt => {
        const upTo = dayOf(receipt.entryDate);
        sequence.push({ date: upTo, seq: 1, row: settlementLine(receipt) });

        const fee = feesBySettlement[receipt.settlementId || receipt.id];
        if (fee) sequence.push({ date: upTo, seq: 2, row: settlementLine(fee) });
    });

    standaloneFees.forEach(row => {
        sequence.push({ date: dayOf(row.entryDate), seq: 2, row: settlementLine(row) });
    });

    settlements
        .filter(
            row =>
                row.entryType === ENTRY_TYPES.reversal && row.entryKind !== ENTRY_KINDS.opening
        )
        .forEach(row => {
            sequence.push({ date: dayOf(row.entryDate), seq: 3, row: settlementLine(row) });
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
        truncated: scoped.length > MAX_ROWS || collections.length >= MAX_ROWS,
    };
};

module.exports = {
    PAYMENT_GATEWAY_STATEMENT_CONVENTION,
    buildCollectionQuery,
    buildUnpostedCollectionQuery,
    fetchCollections,
    collectionLine,
    settlementLine,
    signedOf,
    buildPaymentGatewayStatement,
    statementExcelRows,
};
