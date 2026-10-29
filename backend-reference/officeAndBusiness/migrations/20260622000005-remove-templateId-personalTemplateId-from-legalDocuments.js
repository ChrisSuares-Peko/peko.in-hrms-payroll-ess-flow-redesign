'use strict';

module.exports = {
    up: async (queryInterface) => {
        const columns = await queryInterface.describeTable('legalDocuments');
        if (columns.templateId) {
            await queryInterface.removeColumn('legalDocuments', 'templateId');
        }
        if (columns.personalTemplateId) {
            await queryInterface.removeColumn('legalDocuments', 'personalTemplateId');
        }
    },

    down: async (queryInterface, Sequelize) => {
        const columns = await queryInterface.describeTable('legalDocuments');
        if (!columns.templateId) {
            await queryInterface.addColumn('legalDocuments', 'templateId', {
                type: Sequelize.BIGINT,
                allowNull: true,
            });
        }
        if (!columns.personalTemplateId) {
            await queryInterface.addColumn('legalDocuments', 'personalTemplateId', {
                type: Sequelize.BIGINT,
                allowNull: true,
            });
        }
    },
};
