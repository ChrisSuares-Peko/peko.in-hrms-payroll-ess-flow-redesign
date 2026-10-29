'use strict';

const TABLE = 'serviceOperators';

module.exports = {
    async up(queryInterface, Sequelize) {
        const description = await queryInterface.describeTable(TABLE);

        if (!description.marginType) {
            await queryInterface.addColumn(TABLE, 'marginType', {
                type: Sequelize.ENUM('FLAT', 'PERCENTAGE'),
                defaultValue: 'PERCENTAGE',
            });
        }
        if (!description.margin) {
            await queryInterface.addColumn(TABLE, 'margin', {
                type: Sequelize.DECIMAL(10, 2),
                defaultValue: 0.0,
            });
        }
    },

    async down() {
        // eslint-disable-next-line no-useless-return
        return;
    },
};
