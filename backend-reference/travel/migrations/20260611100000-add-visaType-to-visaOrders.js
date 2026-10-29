'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const tableDesc = await queryInterface.describeTable('visaOrders');
        if (!tableDesc.visa_type) {
            await queryInterface.addColumn('visaOrders', 'visa_type', {
                type: Sequelize.STRING,
                allowNull: true,
                defaultValue: null,
            });
        }
    },
    down: async (queryInterface) => {
        const tableDesc = await queryInterface.describeTable('visaOrders');
        if (tableDesc.visa_type) {
            await queryInterface.removeColumn('visaOrders', 'visa_type');
        }
    },
};
