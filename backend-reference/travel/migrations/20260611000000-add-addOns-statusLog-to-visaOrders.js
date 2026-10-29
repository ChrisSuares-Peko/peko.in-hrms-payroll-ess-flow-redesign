'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const tableDesc = await queryInterface.describeTable('visaOrders');
        if (!tableDesc.add_ons) {
            await queryInterface.addColumn('visaOrders', 'add_ons', {
                type: Sequelize.JSON,
                allowNull: true,
                defaultValue: null,
            });
        }
        if (!tableDesc.status_log) {
            await queryInterface.addColumn('visaOrders', 'status_log', {
                type: Sequelize.JSON,
                allowNull: true,
                defaultValue: null,
            });
        }
    },
    down: async (queryInterface) => {
        const tableDesc = await queryInterface.describeTable('visaOrders');
        if (tableDesc.add_ons) {
            await queryInterface.removeColumn('visaOrders', 'add_ons');
        }
        if (tableDesc.status_log) {
            await queryInterface.removeColumn('visaOrders', 'status_log');
        }
    },
};
