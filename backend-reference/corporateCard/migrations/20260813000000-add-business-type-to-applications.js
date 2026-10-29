'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const table = await queryInterface.describeTable('corporateCardAdminApplications');
        if (!table.businessType) {
            await queryInterface.addColumn('corporateCardAdminApplications', 'businessType', {
                type: Sequelize.STRING,
                allowNull: true,
            });
        }
    },

    down: async (queryInterface) => {
        const table = await queryInterface.describeTable('corporateCardAdminApplications');
        if (table.businessType) {
            await queryInterface.removeColumn('corporateCardAdminApplications', 'businessType');
        }
    },
};
