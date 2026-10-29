'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const columns = await queryInterface.describeTable('legalDocuments');
        if (!columns.editorHtml) {
            await queryInterface.addColumn('legalDocuments', 'editorHtml', {
                type: Sequelize.TEXT('long'),
                allowNull: true,
                defaultValue: null,
                after: 'status',
            });
        }
    },

    down: async (queryInterface) => {
        const columns = await queryInterface.describeTable('legalDocuments');
        if (columns.editorHtml) {
            await queryInterface.removeColumn('legalDocuments', 'editorHtml');
        }
    },
};
