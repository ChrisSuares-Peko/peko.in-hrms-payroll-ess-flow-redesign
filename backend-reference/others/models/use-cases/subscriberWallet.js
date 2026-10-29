const sequelizeConfig = require("../../configs/database/index");
const { toNumber, money } = require("./ledgerStatement");
const { LEDGER_FROM, FUNDING_CATEGORIES, IS_FUNDING, SERVICE_NAME_SQL } = require("./subscriberLedger");
const { WALLET_ROW_COLUMNS, FUNDING_SET, walletLines } = require("./subscriberStatement");
const { loadAccountingFloor } = require("./accountingPeriod");
const { NOT_APPLICABLE } = require("./journalPosting");

const MOVEMENT_COLUMNS = `${WALLET_ROW_COLUMNS}, transactions.transactionDate, transactions.remarks`;

const DEBIT = "debit";
const CREDIT = "credit";

const AMOUNT_COLUMNS = { [DEBIT]: "debitAmount", [CREDIT]: "creditAmount" };

// Each Type the table shows, as the rows that make it up. An order's wallet row is read from
// one side by the sign of that side's amount; an admin movement is told by its category.
const WALLET_TYPES = {
    purchase: { label: "Purchase", arm: DEBIT, sign: ">" },
    refund: { label: "Refund", arm: DEBIT, sign: "<" },
    cashback: { label: "Cashback", arm: CREDIT, sign: ">" },
    "cashback-reversal": { label: "Cashback reversal", arm: CREDIT, sign: "<" },
    "top-up": { label: "Top-up", category: FUNDING_CATEGORIES.topUp },
    "admin-credit": { label: "Admin credit", category: FUNDING_CATEGORIES.adminCredit },
    "admin-withdrawal": { label: "Admin withdrawal", category: FUNDING_CATEGORIES.adminWithdrawal },
};

const SIDES = [DEBIT, CREDIT];

const select = (sql, replacements) =>
    sequelizeConfig.query(sql, { replacements, type: sequelizeConfig.QueryTypes.SELECT });

// What the row reads as in the table's Type column, from the side it is read from.
const typeCondition = (key, arm) => {
    const type = WALLET_TYPES[key];
    if (type.category) return `COALESCE(transactions.transactionCategory, '') = '${type.category}'`;
    if (type.arm !== arm) return "1 = 0";
    return `NOT (${IS_FUNDING}) AND transactions.${AMOUNT_COLUMNS[arm]} ${type.sign} 0`;
};

// A debit takes money out of the wallet: a positive debit side or a negative credit side.
const sideCondition = (side, arm) => {
    const column = `transactions.${AMOUNT_COLUMNS[arm]}`;
    const takesOut = side === DEBIT;
    return arm === DEBIT ? `${column} ${takesOut ? ">" : "<"} 0` : `${column} ${takesOut ? "<" : ">"} 0`;
};

// What the table shows: the reference, the service or the team member in the particulars and
// their remark, and the Type, which a typed word can name.
const searchCondition = (arm, searchText) => {
    const needle = String(searchText).toLowerCase();
    const namedTypes = Object.keys(WALLET_TYPES)
        .filter(key => WALLET_TYPES[key].label.toLowerCase().includes(needle))
        .map(key => `(${typeCondition(key, arm)})`);

    return `(${[
        "transactions.corporateTxnId LIKE :searchText",
        `${SERVICE_NAME_SQL} LIKE :searchText`,
        `(${IS_FUNDING} AND (transactions.providerId LIKE :searchText OR transactions.remarks LIKE :searchText))`,
        ...namedTypes,
    ].join(" OR ")})`;
};

const walletWhere = (arm, { range, searchText, type, side }) => {
    const where = [
        "transactions.credentialId = :credentialId",
        `COALESCE(transactions.${AMOUNT_COLUMNS[arm]}, 0) <> 0`,
    ];
    if (range) where.push("transactions.transactionDate BETWEEN :from AND :to");
    if (Object.hasOwn(WALLET_TYPES, type)) where.push(typeCondition(type, arm));
    if (SIDES.includes(side)) where.push(sideCondition(side, arm));
    if (searchText) where.push(searchCondition(arm, searchText));
    return `WHERE ${where.join(" AND ")}`;
};

const debitMovements = filters =>
    `SELECT ${MOVEMENT_COLUMNS}, transactions.debitAmount, 0 AS creditAmount, 1 AS movementOrder, ` +
    "transactions.balance - COALESCE(transactions.creditAmount, 0) AS balanceAfter " +
    `${LEDGER_FROM} ${walletWhere(DEBIT, filters)}`;

const creditMovements = filters =>
    `SELECT ${MOVEMENT_COLUMNS}, 0 AS debitAmount, transactions.creditAmount, 2 AS movementOrder, ` +
    "transactions.balance AS balanceAfter " +
    `${LEDGER_FROM} ${walletWhere(CREDIT, filters)}`;

const buildWalletMovementsQuery = (filters = {}) =>
    `(${debitMovements(filters)}) UNION ALL (${creditMovements(filters)}) ` +
    "ORDER BY transactionDate DESC, id DESC, movementOrder DESC LIMIT :limit OFFSET :offset";

// The service a search names is on the order, so only a search needs the joins to count.
const buildWalletMovementsCountQuery = (filters = {}) => {
    const from = filters.searchText ? LEDGER_FROM : "FROM transactions";
    const count = arm => `(SELECT COUNT(*) ${from} ${walletWhere(arm, filters)})`;
    return `SELECT ${count(DEBIT)} + ${count(CREDIT)} AS totalCount`;
};

const listWalletMovements = async ({ credentialId, range, searchText, type, side, limit, offset }) => {
    const filters = { range, searchText, type, side };
    const replacements = { credentialId };
    if (range) {
        replacements.from = range.from;
        replacements.to = range.to;
    }
    if (searchText) replacements.searchText = `%${searchText}%`;

    const accountingFloor = await loadAccountingFloor();
    const [rows, countRows] = await Promise.all([
        select(buildWalletMovementsQuery(filters), { ...replacements, accountingFloor, limit, offset }),
        select(buildWalletMovementsCountQuery(filters), replacements),
    ]);

    return { rows, count: countRows.length ? toNumber(countRows[0].totalCount) : 0 };
};

const serializeWalletMovement = row => {
    const [line] = walletLines(row);
    return {
        id: `${row.id}-${row.movementOrder}`,
        transactionDate: row.transactionDate,
        reference: row.reference || null,
        type: line ? line.type : null,
        particulars: line ? line.particulars : null,
        remark: FUNDING_SET.has(row.category) ? row.remarks || null : null,
        debit: line ? line.debit : null,
        credit: line ? line.credit : null,
        balanceAfter: money(row.balanceAfter),
        posting: line ? line.posting : NOT_APPLICABLE,
    };
};

module.exports = {
    WALLET_TYPES,
    buildWalletMovementsQuery,
    buildWalletMovementsCountQuery,
    listWalletMovements,
    serializeWalletMovement,
};
