const { DataTypes } = require("sequelize");
const logger = require("./logger");

const FLAG_COLUMN = { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false };

const DUPLICATE_COLUMN = "ER_DUP_FIELDNAME";

const REQUIRED_COLUMNS = [
    { table: "serviceOperators", column: "isCommissionConfigured" },
    { table: "cashbacks", column: "isSurchargeConfigured" },
    { table: "packages", column: "isCommissionConfigured" },
    { table: "mobileRechargeProviders", column: "isCommissionConfigured" },
    { table: "plans", column: "isCommissionConfigured" },
    { table: "work_plans", column: "isCommissionConfigured" },
    { table: "hikes", column: "isCommissionConfigured" },
    { table: "domainHostingPlans", column: "isCommissionConfigured" },
    { table: "businessRegistrationCatalogs", column: "isCommissionConfigured" },
    { table: "softwares_subscriptions_plans", column: "isCommissionConfigured" },
    { table: "esimPlans", column: "isCommissionConfigured" },
    { table: "giftCards", column: "isCommissionConfigured" },
    { table: "carReportPlans", column: "isCommissionConfigured" },
    { table: "govtServicesCatalogs", column: "isCommissionConfigured" },
];

const errorCode = error => error?.original?.code || error?.parent?.code || error?.code;

const markExistingRows = async (queryInterface, { table, column }) => {
    try {
        const affected = await queryInterface.bulkUpdate(table, { [column]: 1 }, {}, {});
        return { backfilled: Number(affected) || 0 };
    } catch (error) {
        return { backfilled: null, backfillError: error };
    }
};

const ensureColumn = async (queryInterface, { table, column }) => {
    let columns;
    try {
        columns = await queryInterface.describeTable(table);
    } catch (error) {
        return { table, column, state: "table-missing", error };
    }
    if (columns[column]) return { table, column, state: "present" };
    try {
        await queryInterface.addColumn(table, column, FLAG_COLUMN);
        return { table, column, state: "added", ...(await markExistingRows(queryInterface, { table, column })) };
    } catch (error) {
        if (errorCode(error) === DUPLICATE_COLUMN) return { table, column, state: "present" };
        return { table, column, state: "failed", error };
    }
};

const report = ({ table, column, state, error, backfilled, backfillError }) => {
    const target = `${table}.${column}`;
    if (state === "added") {
        logger.info(
            backfilled === null
                ? `Accounting schema guard added ${target}`
                : `Accounting schema guard added ${target} and marked ${backfilled} existing rows configured`
        );
        if (backfillError) {
            logger.error(`Accounting schema guard could not mark existing rows configured for ${target}`, {
                error: backfillError,
            });
        }
    }
    if (state === "table-missing") logger.warn(`Accounting schema guard skipped ${target}: table not found`);
    if (state === "failed") logger.error(`Accounting schema guard could not add ${target}`, { error });
};

const ensureAccountingColumns = async sequelize => {
    const queryInterface = sequelize.getQueryInterface();
    const results = [];
    for (const required of REQUIRED_COLUMNS) {
        // eslint-disable-next-line no-await-in-loop
        const result = await ensureColumn(queryInterface, required);
        report(result);
        results.push(result);
    }
    return results;
};

const LEDGER_ENTRY_TABLES = [
    "vendorDeposits",
    "vendorLedgerEntries",
    "partnerPayouts",
    "partnerLedgerEntries",
    "paymentGatewaySettlements",
];

const LEDGER_BOOKS_COLUMNS = {
    booksSynced: FLAG_COLUMN,
    booksSyncedAt: { type: DataTypes.DATE, allowNull: true },
    booksSyncedById: { type: DataTypes.BIGINT, allowNull: true },
    booksSyncedByName: { type: DataTypes.STRING, allowNull: true },
    deletedAt: { type: DataTypes.DATE, allowNull: true },
    deletedById: { type: DataTypes.BIGINT, allowNull: true },
    deletedByName: { type: DataTypes.STRING, allowNull: true },
    deleteReason: { type: DataTypes.TEXT, allowNull: true },
};

const LEDGER_ENTRY_NUMBER_COLUMNS = {
    entryNumber: { type: DataTypes.STRING(24), allowNull: true },
};

const LEDGER_GUARDED_COLUMNS = { ...LEDGER_BOOKS_COLUMNS, ...LEDGER_ENTRY_NUMBER_COLUMNS };

const ensureLedgerTableColumns = async (queryInterface, table) => {
    let existing;
    try {
        existing = await queryInterface.describeTable(table);
    } catch (error) {
        return [{ table, column: "booksSynced", state: "table-missing", error }];
    }
    const results = [];
    for (const [column, definition] of Object.entries(LEDGER_GUARDED_COLUMNS)) {
        if (existing[column]) {
            results.push({ table, column, state: "present" });
        } else {
            try {
                // eslint-disable-next-line no-await-in-loop
                await queryInterface.addColumn(table, column, definition);
                results.push({ table, column, state: "added", backfilled: null });
            } catch (error) {
                const state = errorCode(error) === DUPLICATE_COLUMN ? "present" : "failed";
                results.push({ table, column, state, error });
            }
        }
    }
    return results;
};

const ensureLedgerBooksColumns = async sequelize => {
    const queryInterface = sequelize.getQueryInterface();
    const results = [];
    for (const table of LEDGER_ENTRY_TABLES) {
        // eslint-disable-next-line no-await-in-loop
        const tableResults = await ensureLedgerTableColumns(queryInterface, table);
        tableResults.forEach(result => {
            report(result);
            results.push(result);
        });
    }
    return results;
};

module.exports = {
    REQUIRED_COLUMNS,
    FLAG_COLUMN,
    LEDGER_ENTRY_TABLES,
    LEDGER_BOOKS_COLUMNS,
    LEDGER_ENTRY_NUMBER_COLUMNS,
    LEDGER_GUARDED_COLUMNS,
    markExistingRows,
    ensureColumn,
    ensureAccountingColumns,
    ensureLedgerBooksColumns,
};
