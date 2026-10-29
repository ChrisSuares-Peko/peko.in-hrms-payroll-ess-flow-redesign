'use strict';

const TABLE = 'corporateDocuments';
const COLUMN = 'sizeBytes';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const table = await queryInterface.describeTable(TABLE);
        if (!table[COLUMN]) {
            await queryInterface.addColumn(TABLE, COLUMN, {
                type: Sequelize.BIGINT,
                allowNull: true,
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
