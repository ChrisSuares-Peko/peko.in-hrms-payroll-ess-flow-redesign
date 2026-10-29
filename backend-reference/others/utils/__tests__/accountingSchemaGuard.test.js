const { DataTypes } = require("sequelize");
const PLAN_ENTITY_CONFIG = require("../planEntityConfig");
const { REQUIRED_COLUMNS, ensureAccountingColumns } = require("../accountingSchemaGuard");
const logger = require("../logger");

jest.mock("../logger", () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }));
jest.mock("../cacheDataMethods", () => ({ getValue: jest.fn(), setValue: jest.fn() }));
jest.mock("../../models/entities/serviceOperator", () => ({ findAll: jest.fn() }));
jest.mock("../../models/entities/systemUser", () => ({ findAll: jest.fn() }));
jest.mock("../../models/entities/roleAndPermissions", () => ({}));
jest.mock("../../models/entities/credential", () => ({ findAll: jest.fn() }));
jest.mock("../../models/entities/chartOfAccount", () => ({ findAll: jest.fn(), count: jest.fn() }));
jest.mock("../../models/entities/vendor", () => ({}));
jest.mock("../../models/use-cases/setting", () => ({ getASetting: jest.fn(), upsertSetting: jest.fn() }));
jest.mock("../sortHandle", () => ({ handleSortFields: jest.fn() }));
jest.mock("../../models/use-cases/accountingServices", () => ({
    getServicesTypeConfig: jest.fn(),
    isCommissionConfigured: jest.fn(),
}));

const { PLAN_CATALOGUES } = require("../../models/use-cases/accountingDashboard");

const FLAG = { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false };

const withoutFlag = { id: { type: "INT" } };

const fakeDatabase = tables => {
    const describeTable = jest.fn(async table => {
        if (!tables[table]) throw new Error(`No description found for "${table}" table.`);
        return tables[table];
    });
    const addColumn = jest.fn(async (table, column) => {
        tables[table][column] = { type: "TINYINT(1)" };
    });
    const bulkUpdate = jest.fn(async () => 7);
    const sequelize = { getQueryInterface: () => ({ describeTable, addColumn, bulkUpdate }) };
    return { sequelize, describeTable, addColumn, bulkUpdate };
};

const everyTableWithFlag = () =>
    Object.fromEntries(
        REQUIRED_COLUMNS.map(({ table, column }) => [table, { id: { type: "INT" }, [column]: { type: "TINYINT(1)" } }])
    );

const stateOf = (results, table) => results.find(result => result.table === table).state;

beforeEach(() => jest.clearAllMocks());

describe("ensureAccountingColumns", () => {
    it("adds only the flags that are missing", async () => {
        const tables = { ...everyTableWithFlag(), packages: { ...withoutFlag }, cashbacks: { ...withoutFlag } };
        const { sequelize, addColumn } = fakeDatabase(tables);

        const results = await ensureAccountingColumns(sequelize);

        expect(addColumn).toHaveBeenCalledTimes(2);
        expect(addColumn).toHaveBeenCalledWith("packages", "isCommissionConfigured", FLAG);
        expect(addColumn).toHaveBeenCalledWith("cashbacks", "isSurchargeConfigured", FLAG);
        expect(stateOf(results, "packages")).toBe("added");
        expect(stateOf(results, "cashbacks")).toBe("added");
        expect(stateOf(results, "plans")).toBe("present");
        expect(logger.info).toHaveBeenCalledWith(
            "Accounting schema guard added packages.isCommissionConfigured and marked 7 existing rows configured"
        );
        expect(logger.error).not.toHaveBeenCalled();
    });

    it("accepts every row that was trading without the flag when it has to add one", async () => {
        const tables = { ...everyTableWithFlag(), cashbacks: { ...withoutFlag } };
        const { sequelize, bulkUpdate } = fakeDatabase(tables);

        const results = await ensureAccountingColumns(sequelize);

        expect(bulkUpdate).toHaveBeenCalledTimes(1);
        expect(bulkUpdate).toHaveBeenCalledWith("cashbacks", { isSurchargeConfigured: 1 }, {}, {});
        expect(results.find(result => result.table === "cashbacks")).toEqual({
            table: "cashbacks",
            column: "isSurchargeConfigured",
            state: "added",
            backfilled: 7,
        });
    });

    it("keeps the column when the existing rows could not be marked, and says so", async () => {
        const tables = { ...everyTableWithFlag(), hikes: { ...withoutFlag } };
        const { sequelize, bulkUpdate } = fakeDatabase(tables);
        const refused = new Error("Lock wait timeout");
        bulkUpdate.mockRejectedValueOnce(refused);

        const results = await ensureAccountingColumns(sequelize);

        expect(results.find(result => result.table === "hikes")).toEqual({
            table: "hikes",
            column: "isCommissionConfigured",
            state: "added",
            backfilled: null,
            backfillError: refused,
        });
        expect(logger.info).toHaveBeenCalledWith("Accounting schema guard added hikes.isCommissionConfigured");
        expect(logger.error).toHaveBeenCalledWith(
            "Accounting schema guard could not mark existing rows configured for hikes.isCommissionConfigured",
            { error: refused }
        );
    });

    it("leaves a table that does not exist alone, says so, and carries on", async () => {
        const tables = everyTableWithFlag();
        delete tables.hikes;
        tables.giftCards = { ...withoutFlag };
        const { sequelize, addColumn } = fakeDatabase(tables);

        const results = await ensureAccountingColumns(sequelize);

        expect(stateOf(results, "hikes")).toBe("table-missing");
        expect(addColumn).not.toHaveBeenCalledWith("hikes", expect.anything(), expect.anything());
        expect(addColumn).toHaveBeenCalledWith("giftCards", "isCommissionConfigured", FLAG);
        expect(logger.warn).toHaveBeenCalledWith(
            "Accounting schema guard skipped hikes.isCommissionConfigured: table not found"
        );
    });

    it("treats a duplicate-column race as already present", async () => {
        const tables = { ...everyTableWithFlag(), plans: { ...withoutFlag } };
        const { sequelize, addColumn } = fakeDatabase(tables);
        addColumn.mockRejectedValueOnce(Object.assign(new Error("Duplicate column name"), {
            original: { code: "ER_DUP_FIELDNAME" },
        }));

        const results = await ensureAccountingColumns(sequelize);

        expect(stateOf(results, "plans")).toBe("present");
        expect(logger.error).not.toHaveBeenCalled();
    });

    it("reports any other failure without throwing and still checks the rest", async () => {
        const tables = { ...everyTableWithFlag(), serviceOperators: { ...withoutFlag }, esimPlans: { ...withoutFlag } };
        const { sequelize, addColumn } = fakeDatabase(tables);
        const refused = new Error("Access denied");
        addColumn.mockRejectedValueOnce(refused);

        const results = await ensureAccountingColumns(sequelize);

        expect(stateOf(results, "serviceOperators")).toBe("failed");
        expect(stateOf(results, "esimPlans")).toBe("added");
        expect(results).toHaveLength(REQUIRED_COLUMNS.length);
        expect(logger.error).toHaveBeenCalledWith(
            "Accounting schema guard could not add serviceOperators.isCommissionConfigured",
            { error: refused }
        );
    });

    it("describes the table before touching it and never adds when the flag is there", async () => {
        const { sequelize, describeTable, addColumn } = fakeDatabase(everyTableWithFlag());

        await ensureAccountingColumns(sequelize);

        expect(describeTable).toHaveBeenCalledTimes(REQUIRED_COLUMNS.length);
        expect(addColumn).not.toHaveBeenCalled();
        expect(logger.info).not.toHaveBeenCalled();
    });
});

describe("REQUIRED_COLUMNS", () => {
    const guarded = column => REQUIRED_COLUMNS.filter(item => item.column === column).map(item => item.table);

    it("covers every plan table the Service with plans pages read", () => {
        const tables = [...new Set(Object.values(PLAN_ENTITY_CONFIG).map(config => config.table))];
        expect(tables.length).toBeGreaterThan(0);
        tables.forEach(table => expect(guarded("isCommissionConfigured")).toContain(table));
    });

    it("covers every catalogue the dashboard and approvals count plans from", () => {
        PLAN_CATALOGUES.forEach(({ table }) => expect(guarded("isCommissionConfigured")).toContain(table));
    });

    it("covers the operator and cashback flags the journal and readiness read", () => {
        expect(guarded("isCommissionConfigured")).toContain("serviceOperators");
        expect(guarded("isSurchargeConfigured")).toEqual(["cashbacks"]);
    });

    it("names each table once per column", () => {
        const keys = REQUIRED_COLUMNS.map(({ table, column }) => `${table}.${column}`);
        expect(new Set(keys).size).toBe(keys.length);
    });

    it("mirrors the guarded migrations' column definition", () => {
        expect(require("../accountingSchemaGuard").FLAG_COLUMN).toEqual(FLAG);
    });
});

describe("ensureLedgerBooksColumns", () => {
    const { ensureLedgerBooksColumns, LEDGER_ENTRY_TABLES, LEDGER_GUARDED_COLUMNS } = require("../accountingSchemaGuard");

    it("reads each ledger entry table once and adds only the columns it lacks", async () => {
        const tables = Object.fromEntries(
            LEDGER_ENTRY_TABLES.map(table => [
                table,
                Object.fromEntries(Object.keys(LEDGER_GUARDED_COLUMNS).map(column => [column, { type: "X" }])),
            ])
        );
        tables.partnerPayouts = { id: { type: "INT" } };
        const { sequelize, describeTable, addColumn, bulkUpdate } = fakeDatabase(tables);

        const results = await ensureLedgerBooksColumns(sequelize);

        expect(describeTable).toHaveBeenCalledTimes(LEDGER_ENTRY_TABLES.length);
        expect(addColumn.mock.calls.map(([table, column]) => `${table}.${column}`)).toEqual(
            Object.keys(LEDGER_GUARDED_COLUMNS).map(column => `partnerPayouts.${column}`)
        );
        expect(addColumn).toHaveBeenCalledWith("partnerPayouts", "booksSynced", FLAG);
        expect(addColumn).toHaveBeenCalledWith(
            "partnerPayouts",
            "entryNumber",
            expect.objectContaining({ allowNull: true })
        );
        expect(bulkUpdate).not.toHaveBeenCalled();
        expect(results.filter(result => result.state === "added")).toHaveLength(9);
    });

    it("skips a table that is not there yet and carries on with the rest", async () => {
        const { sequelize, addColumn } = fakeDatabase({ vendorDeposits: { id: { type: "INT" } } });

        const results = await ensureLedgerBooksColumns(sequelize);

        expect(addColumn.mock.calls.every(([table]) => table === "vendorDeposits")).toBe(true);
        expect(results.filter(result => result.state === "table-missing")).toHaveLength(4);
        expect(logger.warn).toHaveBeenCalled();
    });
});
