const migration = require("../20261005134649-backfill-configured-flags-at-approval-go-live");
const { REQUIRED_COLUMNS } = require("../../utils/accountingSchemaGuard");

jest.mock("../../utils/logger", () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }));

const { FLAG_COLUMNS } = migration;

const everyTable = () => Object.fromEntries(FLAG_COLUMNS.map(({ table, column }) => [table, { id: {}, [column]: {} }]));

const queryInterface = tables => {
    const describeTable = jest.fn(async table => {
        if (!tables[table]) throw new Error(`No description found for "${table}" table.`);
        return tables[table];
    });
    const query = jest.fn(async () => [[], {}]);
    return { describeTable, sequelize: { query } };
};

const updatesOf = qi => qi.sequelize.query.mock.calls.map(([sql]) => sql);

beforeEach(() => jest.clearAllMocks());

describe("FLAG_COLUMNS", () => {
    it("names exactly the columns the schema guard keeps", () => {
        expect(FLAG_COLUMNS).toEqual(REQUIRED_COLUMNS);
    });
});

describe("up", () => {
    it("marks every existing row configured, only where the mark is still off", async () => {
        const qi = queryInterface(everyTable());

        await migration.up(qi);

        expect(updatesOf(qi)).toHaveLength(FLAG_COLUMNS.length);
        expect(updatesOf(qi)).toContain("UPDATE `cashbacks` SET `isSurchargeConfigured` = 1 WHERE `isSurchargeConfigured` = 0");
        expect(updatesOf(qi)).toContain("UPDATE `esimPlans` SET `isCommissionConfigured` = 1 WHERE `isCommissionConfigured` = 0");
    });

    it("skips a table or a column that is not there", async () => {
        const tables = everyTable();
        delete tables.hikes;
        tables.packages = { id: {} };
        const qi = queryInterface(tables);

        await migration.up(qi);

        expect(updatesOf(qi)).toHaveLength(FLAG_COLUMNS.length - 2);
        expect(updatesOf(qi).some(sql => sql.includes("`hikes`"))).toBe(false);
        expect(updatesOf(qi).some(sql => sql.includes("`packages`"))).toBe(false);
    });
});

describe("down", () => {
    it("cannot tell the accepted rows apart any more, so it changes nothing", async () => {
        const qi = queryInterface(everyTable());

        await migration.down(qi);

        expect(qi.sequelize.query).not.toHaveBeenCalled();
    });
});
