"use strict";

const SEQUENCES = "accountingSequences";
const COLUMN = "entryNumber";
const WIDTH = 6;

const TABLES = [
    {
        table: "vendorDeposits",
        prefix: "CASE WHEN t.entryType = 'OPENING' OR original.entryType = 'OPENING' THEN 'OPB' ELSE 'DEP' END",
        join: "LEFT JOIN `vendorDeposits` AS original ON original.id = t.reversesId",
    },
    {
        table: "vendorLedgerEntries",
        prefix:
            "CASE t.kind WHEN 'CREDIT_NOTE' THEN 'VCN' WHEN 'COMMISSION' THEN 'COM' " +
            "WHEN 'COST_OF_SALES' THEN 'COS' WHEN 'DEBIT_NOTE' THEN 'VDN' END",
        join: "",
    },
    {
        table: "partnerPayouts",
        prefix: "CASE WHEN t.entryKind = 'OPENING' THEN 'OPB' ELSE 'PAY' END",
        join: "",
    },
    { table: "partnerLedgerEntries", prefix: "'PDN'", join: "" },
    {
        table: "paymentGatewaySettlements",
        prefix: "CASE t.entryKind WHEN 'OPENING' THEN 'OPB' WHEN 'FEE' THEN 'BIL' ELSE 'RCT' END",
        join: "",
    },
];

const indexOf = table => `${table}_entryNumber_unique`;

const columnDefinition = (Sequelize, allowNull) => ({ type: Sequelize.STRING(24), allowNull });

const backfillSql = ({ table, prefix, join }) =>
    `UPDATE \`${table}\` AS target
    JOIN (
        SELECT id, prefix, ROW_NUMBER() OVER (PARTITION BY prefix ORDER BY id) AS seq
        FROM (SELECT t.id, ${prefix} AS prefix FROM \`${table}\` AS t ${join} WHERE t.${COLUMN} IS NULL) AS pending
    ) AS numbered ON numbered.id = target.id
    LEFT JOIN \`${SEQUENCES}\` AS counter ON counter.name = numbered.prefix
    SET target.${COLUMN} = CONCAT(
        numbered.prefix, '-',
        LPAD(numbered.seq + COALESCE(counter.lastValue, 0), GREATEST(${WIDTH}, CHAR_LENGTH(numbered.seq + COALESCE(counter.lastValue, 0))), '0')
    )`;

const lastValuesSql = table =>
    `SELECT SUBSTRING_INDEX(${COLUMN}, '-', 1) AS name,
        MAX(CAST(SUBSTRING_INDEX(${COLUMN}, '-', -1) AS UNSIGNED)) AS lastValue
    FROM \`${table}\` WHERE ${COLUMN} IS NOT NULL GROUP BY name`;

const UPSERT_COUNTER_SQL =
    `INSERT INTO \`${SEQUENCES}\` (name, lastValue, createdAt, updatedAt) VALUES (:name, :lastValue, NOW(), NOW()) ` +
    "ON DUPLICATE KEY UPDATE lastValue = GREATEST(lastValue, :lastValue), updatedAt = NOW()";

const hasIndex = async (queryInterface, table, name) => {
    const indexes = await queryInterface.showIndex(table);
    return indexes.some(index => index.name === name);
};

module.exports = {
    TABLES,
    COLUMN,
    SEQUENCES,
    indexOf,
    backfillSql,
    lastValuesSql,
    UPSERT_COUNTER_SQL,

    async up(queryInterface, Sequelize) {
        if (!(await queryInterface.tableExists(SEQUENCES))) {
            await queryInterface.createTable(SEQUENCES, {
                name: { type: Sequelize.STRING(16), primaryKey: true, allowNull: false },
                lastValue: { type: Sequelize.BIGINT, allowNull: false, defaultValue: 0 },
                createdAt: { type: Sequelize.DATE, allowNull: false },
                updatedAt: { type: Sequelize.DATE, allowNull: false },
            });
        }

        for (const spec of TABLES) {
            const described = await queryInterface.describeTable(spec.table);
            if (!described[COLUMN]) {
                await queryInterface.addColumn(spec.table, COLUMN, columnDefinition(Sequelize, true));
            }

            await queryInterface.sequelize.query(backfillSql(spec));
            const [counters] = await queryInterface.sequelize.query(lastValuesSql(spec.table));
            for (const counter of counters) {
                await queryInterface.sequelize.query(UPSERT_COUNTER_SQL, {
                    replacements: { name: counter.name, lastValue: Number(counter.lastValue) },
                });
            }

            await queryInterface.changeColumn(spec.table, COLUMN, columnDefinition(Sequelize, false));
            if (!(await hasIndex(queryInterface, spec.table, indexOf(spec.table)))) {
                await queryInterface.addIndex(spec.table, [COLUMN], {
                    unique: true,
                    name: indexOf(spec.table),
                });
            }
        }
    },

    async down(queryInterface) {
        for (const spec of TABLES) {
            const described = await queryInterface.describeTable(spec.table);
            if (!described[COLUMN]) continue;

            if (await hasIndex(queryInterface, spec.table, indexOf(spec.table))) {
                await queryInterface.removeIndex(spec.table, indexOf(spec.table));
            }
            await queryInterface.removeColumn(spec.table, COLUMN);
        }

        if (await queryInterface.tableExists(SEQUENCES)) {
            await queryInterface.dropTable(SEQUENCES);
        }
    },
};
