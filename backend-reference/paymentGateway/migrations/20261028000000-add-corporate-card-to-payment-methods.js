'use strict';

// Adds CORPORATE_CARD to payment_methods.paymentMethod. MySQL needs the whole ENUM re-declared, in order.
const TABLE_CANDIDATES = ['payment_methods', 'paymentMethods', 'paymentmethods'];
const COLUMN = 'paymentMethod';
const VALUES_BEFORE = ['PAYMENT_GATEWAY', 'WALLET'];
const VALUES_AFTER = [...VALUES_BEFORE, 'CORPORATE_CARD'];

const enumSql = (values) => values.map((v) => `'${v}'`).join(', ');

const findTable = async (queryInterface) => {
    const names = (await queryInterface.showAllTables()).map((t) => (typeof t === 'string' ? t : t.tableName));
    return TABLE_CANDIDATES.find((name) => names.includes(name)) || null;
};

const describeColumn = async (queryInterface, table) => {
    try {
        return (await queryInterface.describeTable(table))[COLUMN] || null;
    } catch (err) {
        return null;
    }
};

module.exports = {
    up: async (queryInterface) => {
        const table = await findTable(queryInterface);
        if (!table) return;
        const column = await describeColumn(queryInterface, table);
        if (!column || String(column.type).includes('CORPORATE_CARD')) return;

        await queryInterface.sequelize.query(
            `ALTER TABLE \`${table}\` MODIFY COLUMN \`${COLUMN}\` ENUM(${enumSql(VALUES_AFTER)}) NOT NULL;`
        );
    },

    down: async (queryInterface) => {
        const table = await findTable(queryInterface);
        if (!table) return;
        const column = await describeColumn(queryInterface, table);
        if (!column || !String(column.type).includes('CORPORATE_CARD')) return;

        const [[row]] = await queryInterface.sequelize.query(
            `SELECT COUNT(*) AS n FROM \`${table}\` WHERE \`${COLUMN}\` = 'CORPORATE_CARD';`
        );
        if (Number(row?.n || 0) > 0) return;

        await queryInterface.sequelize.query(
            `ALTER TABLE \`${table}\` MODIFY COLUMN \`${COLUMN}\` ENUM(${enumSql(VALUES_BEFORE)}) NOT NULL;`
        );
    },
};
