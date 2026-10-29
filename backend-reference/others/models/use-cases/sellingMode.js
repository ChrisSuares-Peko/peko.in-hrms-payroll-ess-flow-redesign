const PRINCIPAL_MARKUP = "PRINCIPAL_MARKUP";
const AGENT_MARKUP = "AGENT_MARKUP";
const MARGIN = "MARGIN";
// An order whose items were sold both ways: the principal part belongs on Other Sales and the
// margin part on the vendor's profile, each in its own proportion.
const MIXED = "MIXED";
// A sale on Peko's own account recorded by hand: neither a vendor's business nor a principal
// markup, so Other Sales and the vendor profiles both leave it alone.
const OWN_REVENUE = "OWN_REVENUE";

const jsonAmount = path =>
    `CAST(JSON_UNQUOTE(JSON_EXTRACT(orders.journalData, '$.${path}')) AS DECIMAL(16, 4))`;

const amountOrZero = path => `COALESCE(${jsonAmount(path)}, 0)`;

const ORDER_COMMISSION_MODE = "JSON_UNQUOTE(JSON_EXTRACT(orders.journalData, '$.commissionMode'))";

const HAS_PRINCIPAL =
    `${amountOrZero("principalSalesPayable")} + ${amountOrZero("principalCommissionExcludingGST")} > 0`;

const HAS_MARGIN = `(${amountOrZero("vendorPayable")} > 0 OR ${amountOrZero("commissionIncludingGST")} > 0)`;

// What the order's own breakdown says when one was worked out, whether or not its lines ever
// reached the books: a principal figure alone is a sale on Peko's own account, a commission or
// a vendor payable alone is a margin sale, and both together is a mixed order. Anything else
// says nothing and the service's own setting answers.
const JOURNAL_EVIDENCE_MODE =
    `CASE WHEN ${HAS_PRINCIPAL} AND NOT ${HAS_MARGIN} THEN '${PRINCIPAL_MARKUP}' ` +
    `WHEN ${HAS_MARGIN} AND NOT (${HAS_PRINCIPAL}) THEN '${MARGIN}' ` +
    `WHEN ${HAS_PRINCIPAL} AND ${HAS_MARGIN} THEN '${MIXED}' END`;

// The mode an order was sold under: what the journal recorded, else what its breakdown shows,
// else the operator's current setting, else the default. The operator alias differs between
// raw SQL (serviceOperators) and a Sequelize include (serviceOperator), so it is passed in.
const commissionModeSql = operatorAlias =>
    `COALESCE(${ORDER_COMMISSION_MODE}, ${JOURNAL_EVIDENCE_MODE}, ` +
    `CONVERT(${operatorAlias}.commissionMode USING utf8mb4), '${MARGIN}')`;

// The principal part of a mixed order, as a share of what the customer bought before the
// platform fee.
const PRINCIPAL_VALUE =
    `(${amountOrZero("principalSalesPayable")} + ${amountOrZero("principalCommissionExcludingGST")} ` +
    `+ ${amountOrZero("outputGSTonPrincipalCommission")})`;

const GOODS_VALUE =
    `(COALESCE(${jsonAmount("totalTransactionAmount")}, orders.amountInINR) - ${amountOrZero("platformFeeIncludingGST")})`;

const MIXED_PRINCIPAL_RATIO =
    `LEAST(1, GREATEST(0, ${PRINCIPAL_VALUE} / NULLIF(${GOODS_VALUE}, 0)))`;

// How much of an order is Peko's own sale: all of a principal markup, none of a margin sale,
// and the principal items' share of a mixed one.
const principalShareSql = operatorAlias =>
    `CASE ${commissionModeSql(operatorAlias)} WHEN '${MIXED}' THEN COALESCE(${MIXED_PRINCIPAL_RATIO}, 0) ` +
    `WHEN '${PRINCIPAL_MARKUP}' THEN 1 ELSE 0 END`;

const MARKUP_MODES = [AGENT_MARKUP, PRINCIPAL_MARKUP];

// The journal never records an agent markup: its items are bucketed with the margin items, so
// a margin-shaped order whose service is set to agent markup is read as one. Only the vendor
// profile tells the two apart; Other Sales and the partner ledger keep the plain reading.
const sellingModeSql = operatorAlias =>
    `CASE WHEN ${commissionModeSql(operatorAlias)} = '${MARGIN}' ` +
    `AND CONVERT(${operatorAlias}.commissionMode USING utf8mb4) = '${AGENT_MARKUP}' ` +
    `THEN '${AGENT_MARKUP}' ELSE ${commissionModeSql(operatorAlias)} END`;

const toNumber = value => Number(value) || 0;

const round4 = value => Math.round((toNumber(value) + Number.EPSILON) * 10000) / 10000;

const journalEvidenceMode = journalData => {
    if (!journalData || typeof journalData !== "object") return null;
    const principal =
        toNumber(journalData.principalSalesPayable) + toNumber(journalData.principalCommissionExcludingGST) > 0;
    const margin = toNumber(journalData.vendorPayable) > 0 || toNumber(journalData.commissionIncludingGST) > 0;
    if (principal && margin) return MIXED;
    if (principal) return PRINCIPAL_MARKUP;
    if (margin) return MARGIN;
    return null;
};

// The same reading as commissionModeSql, for a journal already in hand.
const commissionModeOfJournal = (journalData, operatorMode = null) =>
    (journalData && journalData.commissionMode) || journalEvidenceMode(journalData) || operatorMode || MARGIN;

// The same reading as sellingModeSql, for a journal already in hand.
const sellingModeOf = (journalData, operatorMode = null) => {
    const mode = commissionModeOfJournal(journalData, operatorMode);
    return mode === MARGIN && operatorMode === AGENT_MARKUP ? AGENT_MARKUP : mode;
};

// The same reading as principalShareSql, for a journal already in hand.
const principalShareOf = (journalData, operatorMode = null) => {
    const mode = commissionModeOfJournal(journalData, operatorMode);
    if (mode === PRINCIPAL_MARKUP) return 1;
    if (mode !== MIXED) return 0;

    const principal =
        toNumber(journalData.principalSalesPayable) +
        toNumber(journalData.principalCommissionExcludingGST) +
        toNumber(journalData.outputGSTonPrincipalCommission);
    const goods = toNumber(journalData.totalTransactionAmount) - toNumber(journalData.platformFeeIncludingGST);
    if (!(goods > 0)) return 0;
    return Math.min(1, Math.max(0, round4(principal / goods)));
};

module.exports = {
    PRINCIPAL_MARKUP,
    AGENT_MARKUP,
    MARGIN,
    MIXED,
    OWN_REVENUE,
    MARKUP_MODES,
    JOURNAL_EVIDENCE_MODE,
    commissionModeSql,
    sellingModeSql,
    principalShareSql,
    journalEvidenceMode,
    commissionModeOfJournal,
    sellingModeOf,
    principalShareOf,
};
