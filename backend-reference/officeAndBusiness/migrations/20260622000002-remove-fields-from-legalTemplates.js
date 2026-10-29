'use strict';

module.exports = {
    up: async (queryInterface) => {
        const columns = await queryInterface.describeTable('legalTemplates');
        if (columns.fields) {
            await queryInterface.removeColumn('legalTemplates', 'fields');
        }
    },

    down: async (queryInterface, Sequelize) => {
        const columns = await queryInterface.describeTable('legalTemplates');
        if (!columns.fields) {
            await queryInterface.addColumn('legalTemplates', 'fields', {
                type: Sequelize.JSON,
                allowNull: true,
                defaultValue: [],
            });
        }
    },
};
