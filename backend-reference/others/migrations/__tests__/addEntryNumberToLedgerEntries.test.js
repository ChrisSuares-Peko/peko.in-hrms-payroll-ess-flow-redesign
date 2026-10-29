const migration = require("../20261027084901-add-entry-number-to-ledger-entries");

const { TABLES, COLUMN, SEQUENCES, indexOf, backfillSql, lastValuesSql, UPSERT_COUNTER_SQL } = migration;

const Sequelize = {
    STRING: jest.fn(length => `STRING(${length})`),
    BIGINT: "BIGINT",
    DATE: "DATE",
};

const flat = sql => sql.replace(/\s+/g, " ").trim();

const queryInterfaceWith = ({ tables = [], columns = {}, indexes = {}, counters = {} } = {}) => {
    const query = jest.fn(async sql => {
        const table = TABLES.find(spec => flat(sql) === flat(lastValuesSql(spec.table)));
        return table ? [counters[table.table] || []] : [[], {}];
    });
    return {
        tableExists: jest.fn(async table => tables.includes(table)),
        createTable: jest.fn(),
        dropTable: jest.fn(),
        describeTable: jest.fn(async table => columns[table] || { id: {} }),
        addColumn: jest.fn(),
        changeColumn: jest.fn(),
        removeColumn: jest.fn(),
        showIndex: jest.fn(async table => (indexes[table] || []).map(name => ({ name }))),
        addIndex: jest.fn(),
        removeIndex: jest.fn(),
        sequelize: { query },
    };
};

const sqlOf = qi => qi.sequelize.query.mock.calls.map(([sql]) => flat(sql));

describe("numbering the hand-recorded ledger entries", () => {
    it("numbers the five tables in an order that lets the shared opening series carry over", () => {
        expect(TABLES.map(spec => spec.table)).toEqual([
            "vendorDeposits",
            "vendorLedgerEntries",
            "partnerPayouts",
            "partnerLedgerEntries",
            "paymentGatewaySettlements",
        ]);
    });

    it("gives a reversal the series of the entry it reverses", () => {
        const deposits = TABLES[0];
        expect(deposits.join).toContain("original.id = t.reversesId");
        expect(deposits.prefix).toContain("original.entryType = 'OPENING' THEN 'OPB' ELSE 'DEP'");
        expect(TABLES[1].prefix).toContain("WHEN 'CREDIT_NOTE' THEN 'VCN'");
        expect(TABLES[1].prefix).toContain("WHEN 'DEBIT_NOTE' THEN 'VDN'");
        expect(TABLES[2].prefix).toBe("CASE WHEN t.entryKind = 'OPENING' THEN 'OPB' ELSE 'PAY' END");
        expect(TABLES[3].prefix).toBe("'PDN'");
        expect(TABLES[4].prefix).toBe(
            "CASE t.entryKind WHEN 'OPENING' THEN 'OPB' WHEN 'FEE' THEN 'BIL' ELSE 'RCT' END"
        );
    });

    it("numbers only rows without a number, in id order, continuing after the counter", () => {
        const sql = flat(backfillSql(TABLES[3]));

        expect(sql).toContain("ROW_NUMBER() OVER (PARTITION BY prefix ORDER BY id) AS seq");
        expect(sql).toContain("WHERE t.entryNumber IS NULL");
        expect(sql).toContain("LEFT JOIN `accountingSequences` AS counter ON counter.name = numbered.prefix");
        expect(sql).toContain("numbered.seq + COALESCE(counter.lastValue, 0)");
        expect(sql).toContain("GREATEST(6, CHAR_LENGTH(");
        expect(flat(lastValuesSql("partnerLedgerEntries"))).toBe(
            "SELECT SUBSTRING_INDEX(entryNumber, '-', 1) AS name, MAX(CAST(SUBSTRING_INDEX(entryNumber, '-', -1) AS UNSIGNED)) AS lastValue FROM `partnerLedgerEntries` WHERE entryNumber IS NOT NULL GROUP BY name"
        );
        expect(UPSERT_COUNTER_SQL).toContain("GREATEST(lastValue, :lastValue)");
    });

    it("creates the counters, adds and backfills the column, then locks it down", async () => {
        const qi = queryInterfaceWith({
            columns: { partnerPayouts: { id: {}, [COLUMN]: {} } },
            indexes: { partnerPayouts: [indexOf("partnerPayouts")] },
            counters: {
                vendorDeposits: [
                    { name: "DEP", lastValue: "4" },
                    { name: "OPB", lastValue: "2" },
                ],
            },
        });

        await migration.up(qi, Sequelize);

        expect(qi.createTable).toHaveBeenCalledWith(
            SEQUENCES,
            expect.objectContaining({
                name: { type: "STRING(16)", primaryKey: true, allowNull: false },
                lastValue: { type: "BIGINT", allowNull: false, defaultValue: 0 },
            })
        );
        expect(qi.addColumn.mock.calls.map(([table]) => table)).toEqual(
            TABLES.map(spec => spec.table).filter(table => table !== "partnerPayouts")
        );
        expect(qi.addColumn).toHaveBeenCalledWith("vendorDeposits", COLUMN, {
            type: "STRING(24)",
            allowNull: true,
        });

        const statements = sqlOf(qi);
        expect(statements.filter(sql => sql.startsWith("UPDATE"))).toEqual(
            TABLES.map(spec => flat(backfillSql(spec)))
        );
        expect(qi.sequelize.query).toHaveBeenCalledWith(UPSERT_COUNTER_SQL, {
            replacements: { name: "DEP", lastValue: 4 },
        });
        expect(qi.sequelize.query).toHaveBeenCalledWith(UPSERT_COUNTER_SQL, {
            replacements: { name: "OPB", lastValue: 2 },
        });
        const order = statements.map(sql => sql.split(" ")[0]);
        expect(order.slice(0, 4)).toEqual(["UPDATE", "SELECT", "INSERT", "INSERT"]);

        expect(qi.changeColumn.mock.calls).toEqual(
            TABLES.map(spec => [spec.table, COLUMN, { type: "STRING(24)", allowNull: false }])
        );
        expect(qi.addIndex.mock.calls).toEqual(
            TABLES.filter(spec => spec.table !== "partnerPayouts").map(spec => [
                spec.table,
                [COLUMN],
                { unique: true, name: indexOf(spec.table) },
            ])
        );
    });

    it("leaves an existing counter table alone", async () => {
        const qi = queryInterfaceWith({ tables: [SEQUENCES] });

        await migration.up(qi, Sequelize);

        expect(qi.createTable).not.toHaveBeenCalled();
    });

    it("drops the column, its index and the counters on down", async () => {
        const qi = queryInterfaceWith({
            tables: [SEQUENCES],
            columns: Object.fromEntries(TABLES.map(spec => [spec.table, { id: {}, [COLUMN]: {} }])),
            indexes: { vendorDeposits: [indexOf("vendorDeposits")] },
        });

        await migration.down(qi);

        expect(qi.removeIndex).toHaveBeenCalledTimes(1);
        expect(qi.removeIndex).toHaveBeenCalledWith("vendorDeposits", indexOf("vendorDeposits"));
        expect(qi.removeColumn.mock.calls).toEqual(TABLES.map(spec => [spec.table, COLUMN]));
        expect(qi.dropTable).toHaveBeenCalledWith(SEQUENCES);
    });

    it("skips a table that never got the column on down", async () => {
        const qi = queryInterfaceWith();

        await migration.down(qi);

        expect(qi.removeColumn).not.toHaveBeenCalled();
        expect(qi.dropTable).not.toHaveBeenCalled();
    });
});
