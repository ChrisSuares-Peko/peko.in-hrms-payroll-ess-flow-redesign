'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const table = await queryInterface.describeTable('corporateCardAdminApplications');
        if (!table.notificationControls) {
            await queryInterface.addColumn('corporateCardAdminApplications', 'notificationControls', {
                type: Sequelize.JSON,
                allowNull: true,
            });
        }
    },

    down: async (queryInterface) => {
        const table = await queryInterface.describeTable('corporateCardAdminApplications');
        if (table.notificationControls) {
            await queryInterface.removeColumn('corporateCardAdminApplications', 'notificationControls');
        }
    },
};
