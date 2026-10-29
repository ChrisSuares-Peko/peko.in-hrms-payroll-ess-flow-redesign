'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const table = await queryInterface.describeTable('cardIssuances');
        if (!table.dispatches) {
            await queryInterface.addColumn('cardIssuances', 'dispatches', {
                type: Sequelize.JSON,
                allowNull: true,
            });
        }
    },

    down: async (queryInterface) => {
        const table = await queryInterface.describeTable('cardIssuances');
        if (table.dispatches) {
            await queryInterface.removeColumn('cardIssuances', 'dispatches');
        }
    },
};
