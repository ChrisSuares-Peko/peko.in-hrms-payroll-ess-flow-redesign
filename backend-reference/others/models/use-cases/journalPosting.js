const { literal } = require("sequelize");

const ORDER_TABLE = "orders";
const SALE_KEY = "transaction";
const REFUND_KEYS = ["refund", "adminRefund"];
const ORDER_POSTING_KEYS = [SALE_KEY, ...REFUND_KEYS];
const FACTS = ["Verdict", "Skipped", "Reason"];

const SALE_STATUSES = ["SUCCESS", "ORDERED", "REFUNDED", "REFUND"];
const REFUND_STATUSES = ["REFUNDED", "REFUND"];
const REVERSAL_STATUSES = ["FAILED", "FAILURE", "CANCELLED"];

const POSTED = Object.freeze({ state: "posted", note: null, detail: null });
const NOT_APPLICABLE = Object.freeze({ state: "notApplicable", note: null, detail: null });

const POSTING_LABELS = { posted: "Posted", notPosted: "Not posted", notApplicable: "Not applicable" };

const SKIP_NOTES = {
    "Journal recording is currently paused": "Recording paused",
    "recordJournalEntry is disabled for this service operator": "Service set not to post",
    "Transaction journal has not been recorded successfully yet": "Waiting for the sale entry",
};
const SKIP_NOTE_PREFIXES = [
    ["Commission not configured", "Commission not configured"],
    ["Surcharge not configured", "Platform fee not configured"],
];
const UNPREPARED_NOTE = "Could not be prepared";
const REFUSED_NOTE = "Books refused it";
const NOT_RECORDED_NOTE = "Not recorded yet";
const REFUND_PREFIX = "Refund: ";

const factSql = (key, table) => ({
    Verdict: `JSON_UNQUOTE(JSON_EXTRACT(${table}.journalRecordStatus, '$.${key}'))`,
    Skipped: `JSON_UNQUOTE(JSON_EXTRACT(${table}.journalData, '$.${key}.skipped'))`,
    Reason: `JSON_UNQUOTE(JSON_EXTRACT(${table}.journalData, '$.${key}.reason'))`,
});

const postingSelect = (key, { prefix = key, table = ORDER_TABLE } = {}) => {
    const sql = factSql(key, table);
    return FACTS.map(fact => `${sql[fact]} AS ${prefix}${fact}`).join(", ");
};

const noPostingSelect = prefix =>
    FACTS.map(fact => `CONVERT(NULL USING utf8mb4) AS ${prefix}${fact}`).join(", ");

const ORDER_POSTING_SELECT = ORDER_POSTING_KEYS.map(key => postingSelect(key)).join(", ");

const orderPostingAttributes = () =>
    ORDER_POSTING_KEYS.flatMap(key => {
        const sql = factSql(key, `\`${ORDER_TABLE}\``);
        return FACTS.map(fact => [literal(sql[fact]), `${key}${fact}`]);
    });

const flagOf = value => {
    if (value === true || value === "true") return true;
    if (value === false || value === "false") return false;
    return null;
};

const textOf = value => {
    if (value === null || value === undefined) return null;
    const text = typeof value === "string" ? value : JSON.stringify(value);
    return text === "" || text === "null" ? null : text;
};

const jsonObjectOf = value => {
    if (typeof value !== "string") return value && typeof value === "object" ? value : {};
    try {
        const parsed = JSON.parse(value);
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        return {};
    }
};

const factsOfRow = (row, prefix) => ({
    verdict: flagOf(row[`${prefix}Verdict`]),
    skipped: flagOf(row[`${prefix}Skipped`]) === true,
    reason: textOf(row[`${prefix}Reason`]),
});

const journalFacts = (verdicts, entries, key) => {
    const entry = entries[key] && typeof entries[key] === "object" ? entries[key] : {};
    return {
        verdict: flagOf(verdicts[key]),
        skipped: flagOf(entry.skipped) === true,
        reason: textOf(entry.reason),
    };
};

const hasTrace = facts => facts.verdict !== null || facts.skipped;

const reachedBooks = facts => facts.verdict === true || (facts.verdict === false && !facts.skipped);

const reachedBooksSql = (key, table = ORDER_TABLE) => {
    const sql = factSql(key, table);
    return `(${sql.Verdict} = 'true' OR (${sql.Verdict} = 'false' AND COALESCE(${sql.Skipped}, 'false') <> 'true'))`;
};

const notReachedBooksSql = (key, table = ORDER_TABLE) => {
    const sql = factSql(key, table);
    return `(${sql.Verdict} IS NULL OR (${sql.Verdict} = 'false' AND COALESCE(${sql.Skipped}, 'false') = 'true'))`;
};

const SALE_REACHED_BOOKS = reachedBooksSql(SALE_KEY);

const statusOf = status =>
    String(status || "")
        .trim()
        .toUpperCase();

const notPosted = (note, detail) => ({ state: "notPosted", note, detail: detail || null });

const skipNoteOf = reason => {
    if (SKIP_NOTES[reason]) return SKIP_NOTES[reason];
    const match = SKIP_NOTE_PREFIXES.find(([prefix]) => typeof reason === "string" && reason.startsWith(prefix));
    return match ? match[1] : UNPREPARED_NOTE;
};

const eventPosting = (facts, { expected = true } = {}) => {
    if (facts.verdict === true) return POSTED;
    if (facts.skipped) return notPosted(skipNoteOf(facts.reason), facts.reason);
    if (facts.verdict === false) return notPosted(REFUSED_NOTE, facts.reason);
    return expected ? notPosted(NOT_RECORDED_NOTE, null) : NOT_APPLICABLE;
};

const eventPostingOfRow = (row, prefix = "event", options) => eventPosting(factsOfRow(row, prefix), options);

const salePosting = (status, facts, traced = hasTrace(facts)) =>
    eventPosting(facts, { expected: traced || SALE_STATUSES.includes(statusOf(status)) });

const expectedRefundKeys = (status, factsByKey, salePosted) => {
    const traced = REFUND_KEYS.filter(key => hasTrace(factsByKey[key]));
    if (traced.length) return traced;
    const code = statusOf(status);
    const reversalDue = REFUND_STATUSES.includes(code) || (salePosted && REVERSAL_STATUSES.includes(code));
    return reversalDue ? [REFUND_KEYS[0]] : [];
};

const orderPosting = (status, factsByKey) => {
    const refundTraced = REFUND_KEYS.some(key => hasTrace(factsByKey[key]));
    const sale = salePosting(status, factsByKey[SALE_KEY], hasTrace(factsByKey[SALE_KEY]) || refundTraced);
    if (sale.state === "notPosted") return sale;
    const refund = expectedRefundKeys(status, factsByKey, sale.state === "posted")
        .map(key => eventPosting(factsByKey[key]))
        .find(posting => posting.state === "notPosted");
    return refund ? { ...refund, note: `${REFUND_PREFIX}${refund.note}` } : sale;
};

const orderPostingOfRow = (row, status = row.status) =>
    orderPosting(status, Object.fromEntries(ORDER_POSTING_KEYS.map(key => [key, factsOfRow(row, key)])));

const saleReachedBooksOfRow = row => reachedBooks(factsOfRow(row, SALE_KEY));

const orderPostingOfJournal = ({ status, journalRecordStatus, journalData }) => {
    const verdicts = jsonObjectOf(journalRecordStatus);
    const entries = jsonObjectOf(journalData);
    return orderPosting(
        status,
        Object.fromEntries(ORDER_POSTING_KEYS.map(key => [key, journalFacts(verdicts, entries, key)]))
    );
};

const eventPostingOfJournal = ({ journalRecordStatus, journalData }, key, options) =>
    eventPosting(journalFacts(jsonObjectOf(journalRecordStatus), jsonObjectOf(journalData), key), options);

const saleReachedBooksOfJournal = ({ journalRecordStatus, journalData }) =>
    reachedBooks(journalFacts(jsonObjectOf(journalRecordStatus), jsonObjectOf(journalData), SALE_KEY));

const refundKeyOfRow = row => REFUND_KEYS.find(key => hasTrace(factsOfRow(row, key))) || REFUND_KEYS[0];

const postingLabel = posting => {
    const label = posting && POSTING_LABELS[posting.state];
    if (!label) return POSTING_LABELS.notApplicable;
    return posting.state === "notPosted" && posting.note ? `${label} — ${posting.note}` : label;
};

const ORDER_STATUS_LABELS = {
    SUCCESS: "Success",
    ORDERED: "Success",
    REFUND: "Refunded",
    REFUNDED: "Refunded",
    FAILED: "Failed",
    FAILURE: "Failed",
};

// The order status as the ledger tables word it.
const orderStatusLabel = status =>
    ORDER_STATUS_LABELS[String(status || "").toUpperCase()] || status || "Unknown";

// The Status filter of a table whose pill reads only the order's own status, in the pill's own
// words. The SQL is written against the `orders` table.
const ORDER_STATUS_FILTERS = {
    success: "orders.status IN ('SUCCESS', 'ORDERED')",
    refunded: "orders.status IN ('REFUND', 'REFUNDED')",
    failed: "orders.status IN ('FAILED', 'FAILURE')",
};

const ORDER_STATUS_FILTER_LABELS = { success: "Success", refunded: "Refunded", failed: "Failed" };

// The three faces of one order's value, all read from the entry: what the customer paid through the
// gateway and from the wallet (net GMV), the coupon, Peko Credit or plan discount Peko bore (discount),
// and the two together (GMV, the value before any discount). An order with no entry keeps the amount
// charged as both GMV and net GMV, with no discount known: on a vendor-service order that is the full
// value, on a subscription it is what the customer paid.
const orderValueParts = (table = "") => {
    const column = name => (table ? `${table}.${name}` : name);
    const journal = field => `JSON_EXTRACT(${column("journalData")}, '$.${field}')`;
    const figure = field => `COALESCE(CAST(JSON_UNQUOTE(${journal(field)}) AS DECIMAL(16, 4)), 0)`;
    return {
        hasEntry: `${journal("paymentThroughGateway")} IS NOT NULL`,
        paid: `${figure("paymentThroughGateway")} + ${figure("paymentThroughWallet")}`,
        discount: figure("couponTotalDiscount"),
        charged: column("amountInINR"),
    };
};

const gmvOfOrder = (table = "") => {
    const parts = orderValueParts(table);
    return `CASE WHEN ${parts.hasEntry} THEN ${parts.paid} + ${parts.discount} ELSE ${parts.charged} END`;
};

const netGmvOfOrder = (table = "") => {
    const parts = orderValueParts(table);
    return `CASE WHEN ${parts.hasEntry} THEN ${parts.paid} ELSE ${parts.charged} END`;
};

const discountOfOrder = (table = "") => {
    const parts = orderValueParts(table);
    return `CASE WHEN ${parts.hasEntry} THEN ${parts.discount} ELSE 0 END`;
};

module.exports = {
    gmvOfOrder,
    netGmvOfOrder,
    discountOfOrder,
    reachedBooks,
    reachedBooksSql,
    notReachedBooksSql,
    SALE_REACHED_BOOKS,
    saleReachedBooksOfRow,
    saleReachedBooksOfJournal,
    SALE_KEY,
    REFUND_KEYS,
    ORDER_POSTING_KEYS,
    POSTED,
    NOT_APPLICABLE,
    POSTING_LABELS,
    SKIP_NOTES,
    SKIP_NOTE_PREFIXES,
    UNPREPARED_NOTE,
    REFUSED_NOTE,
    NOT_RECORDED_NOTE,
    REFUND_PREFIX,
    postingSelect,
    noPostingSelect,
    ORDER_POSTING_SELECT,
    orderPostingAttributes,
    flagOf,
    factsOfRow,
    eventPosting,
    eventPostingOfRow,
    eventPostingOfJournal,
    salePosting,
    orderPosting,
    orderPostingOfRow,
    orderPostingOfJournal,
    refundKeyOfRow,
    postingLabel,
    orderStatusLabel,
    ORDER_STATUS_FILTERS,
    ORDER_STATUS_FILTER_LABELS,
};
