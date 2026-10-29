'use strict';

module.exports = {
    up: async (queryInterface) => {
        const columns = await queryInterface.describeTable('legalDocuments');
        if (columns.fieldValues) {
            await queryInterface.removeColumn('legalDocuments', 'fieldValues');
        }
    },

    down: async (queryInterface, Sequelize) => {
        const columns = await queryInterface.describeTable('legalDocuments');
        if (!columns.fieldValues) {
            await queryInterface.addColumn('legalDocuments', 'fieldValues', {
                type: Sequelize.JSON,
                allowNull: true,
                defaultValue: {},
            });
        }
    },
};
