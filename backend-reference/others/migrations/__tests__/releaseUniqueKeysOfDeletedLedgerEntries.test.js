const migration = require("../20261009050943-release-unique-keys-of-deleted-ledger-entries");

const { KEYS, withoutDeleted } = migration;

const LIVE_COLUMNS = { deletedAt: {}, activeReferenceKey: {}, activeOpeningKey: {}, activeEntryKey: {} };

const queryInterfaceWith = ({ columns = {}, indexes = {} } = {}) => ({
    describeTable: jest.fn(async table => columns[table] || LIVE_COLUMNS),
    showIndex: jest.fn(async table =>
        indexes[table] || KEYS.filter(key => key.table === table).map(key => ({ name: key.index }))
    ),
    removeIndex: jest.fn(),
    removeColumn: jest.fn(),
    addIndex: jest.fn(),
    sequelize: { query: jest.fn() },
});

const flat = sql => sql.replace(/\s+/g, " ").trim();
const altersOf = qi => qi.sequelize.query.mock.calls.map(([sql]) => flat(sql));

describe("releasing the unique keys of deleted ledger entries", () => {
    it("covers each key of the five ledger tables once", () => {
        expect(KEYS.map(key => `${key.table}.${key.column}`)).toEqual([
            "vendorDeposits.activeReferenceKey",
            "vendorDeposits.activeOpeningKey",
            "vendorLedgerEntries.activeEntryKey",
            "partnerPayouts.activeReferenceKey",
            "partnerPayouts.activeOpeningKey",
            "partnerLedgerEntries.activeEntryKey",
            "paymentGatewaySettlements.activeReferenceKey",
            "paymentGatewaySettlements.activeOpeningKey",
        ]);
    });

    it("keeps each key as it was and only leaves deleted rows out of it", () => {
        expect(withoutDeleted("IF(a, b, NULL)")).toBe("IF(deletedAt IS NULL, IF(a, b, NULL), NULL)");
    });

    it("rebuilds every key on up with deleted rows left out, index included", async () => {
        const qi = queryInterfaceWith();

        await migration.up(qi);

        KEYS.forEach(({ table, column, index }) => {
            expect(qi.removeIndex).toHaveBeenCalledWith(table, index);
            expect(qi.removeColumn).toHaveBeenCalledWith(table, column);
            expect(qi.addIndex).toHaveBeenCalledWith(table, [column], { unique: true, name: index });
        });
        expect(altersOf(qi)).toEqual(
            KEYS.map(
                ({ table, column, type, expression }) =>
                    `ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${type} GENERATED ALWAYS AS (IF(deletedAt IS NULL, ${expression}, NULL)) STORED`
            )
        );
    });

    it("puts the original keys back on down", async () => {
        const qi = queryInterfaceWith();

        await migration.down(qi);

        expect(altersOf(qi)).toEqual(
            KEYS.map(
                ({ table, column, type, expression }) =>
                    `ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${type} GENERATED ALWAYS AS (${expression}) STORED`
            )
        );
        altersOf(qi).forEach(sql => expect(sql).not.toContain("deletedAt"));
    });

    it("leaves a table alone when it never had the key", async () => {
        const qi = queryInterfaceWith({ columns: { partnerLedgerEntries: { deletedAt: {} } } });

        await migration.up(qi);

        expect(qi.removeColumn).not.toHaveBeenCalledWith("partnerLedgerEntries", "activeEntryKey");
        expect(altersOf(qi).some(sql => sql.includes("`partnerLedgerEntries`"))).toBe(false);
        expect(qi.sequelize.query).toHaveBeenCalledTimes(KEYS.length - 1);
    });

    it("does not drop an index that is already gone", async () => {
        const qi = queryInterfaceWith({ indexes: { vendorDeposits: [] } });

        await migration.up(qi);

        expect(qi.removeIndex).not.toHaveBeenCalledWith("vendorDeposits", expect.anything());
        expect(qi.addIndex).toHaveBeenCalledWith("vendorDeposits", ["activeOpeningKey"], {
            unique: true,
            name: "vendorDeposits_activeOpening_unique",
        });
    });

    it("refuses before dropping anything when a table has no deleted column", async () => {
        const qi = queryInterfaceWith({ columns: { vendorDeposits: { activeReferenceKey: {}, activeOpeningKey: {} } } });

        await expect(migration.up(qi)).rejects.toThrow("vendorDeposits has no deletedAt column");
        expect(qi.removeIndex).not.toHaveBeenCalled();
        expect(qi.removeColumn).not.toHaveBeenCalled();
    });
});
