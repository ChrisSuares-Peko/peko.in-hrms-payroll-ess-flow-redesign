'use strict';

module.exports = {
    up: async (queryInterface) => {
        const columns = await queryInterface.describeTable('userPersonalTemplates');
        if (columns.fields) {
            await queryInterface.removeColumn('userPersonalTemplates', 'fields');
        }
    },

    down: async (queryInterface, Sequelize) => {
        const columns = await queryInterface.describeTable('userPersonalTemplates');
        if (!columns.fields) {
            await queryInterface.addColumn('userPersonalTemplates', 'fields', {
                type: Sequelize.JSON,
                allowNull: true,
                defaultValue: [],
            });
        }
    },
};
