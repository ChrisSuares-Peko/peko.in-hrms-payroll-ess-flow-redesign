'use strict';

const TABLE = 'orders';

const COLUMNS = [
    'vat',
    'pgCharge',
    'vendorCost',
    'VATP',
    'amountSurplus',
    'partnerShare',
    'actualEarnings',
];

const hasColumn = (description, column) =>
    Object.keys(description).some((name) => name.toLowerCase() === column.toLowerCase());

module.exports = {
    async up(queryInterface, Sequelize) {
        let description = null;
        try {
            description = await queryInterface.describeTable(TABLE);
        } catch (err) {
            return;
        }

        for (const column of COLUMNS) {
            if (!hasColumn(description, column)) {
                await queryInterface.addColumn(TABLE, column, {
                    type: Sequelize.DECIMAL(12, 4),
                    allowNull: true,
                });
            }
        }
    },

    async down() {
        // eslint-disable-next-line no-useless-return
        return;
    },
};
