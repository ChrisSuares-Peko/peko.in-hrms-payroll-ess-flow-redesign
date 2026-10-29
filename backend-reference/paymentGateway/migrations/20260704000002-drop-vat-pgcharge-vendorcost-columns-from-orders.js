'use strict';

const TABLE = 'orders';
const COLUMNS = ['vat', 'pgCharge', 'vendorCost', 'VATP', 'amountSurplus', 'partnerShare', 'actualEarnings'];

module.exports = {
    async up(queryInterface) {
        for (const column of COLUMNS) {
            const [rows] = await queryInterface.sequelize.query(
                `SHOW COLUMNS FROM \`${TABLE}\` LIKE '${column}'`
            );
            if (rows.length === 0) {
                console.log(`[drop-orders-columns] column '${column}' already absent — skipping`);
                continue;
            }
            await queryInterface.removeColumn(TABLE, column);
            console.log(`[drop-orders-columns] dropped '${column}'`);
        }
    },

    async down(queryInterface, Sequelize) {
        for (const column of COLUMNS) {
            const [rows] = await queryInterface.sequelize.query(
                `SHOW COLUMNS FROM \`${TABLE}\` LIKE '${column}'`
            );
            if (rows.length > 0) {
                console.log(`[drop-orders-columns] column '${column}' already exists — skipping restore`);
                continue;
            }
            await queryInterface.addColumn(TABLE, column, {
                type: Sequelize.DECIMAL(12, 4),
                allowNull: true,
                defaultValue: null,
            });
        }
    },
};
