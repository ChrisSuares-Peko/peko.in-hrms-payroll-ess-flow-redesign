'use strict';

const TABLE = 'corporateCardAgreements';
const COLUMN = 'addressProofSameAsGst';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const table = await queryInterface.describeTable(TABLE);
        if (!table[COLUMN]) {
            await queryInterface.addColumn(TABLE, COLUMN, {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            });
        }
    },

    down: async (queryInterface) => {
        const table = await queryInterface.describeTable(TABLE);
        if (table[COLUMN]) {
            await queryInterface.removeColumn(TABLE, COLUMN);
        }
    },
};
