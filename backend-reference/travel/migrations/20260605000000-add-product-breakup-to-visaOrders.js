'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        const tableDesc = await queryInterface.describeTable('visaOrders');
        if (!tableDesc.product_breakup) {
            await queryInterface.addColumn('visaOrders', 'product_breakup', {
                type: Sequelize.JSON,
                allowNull: true,
                defaultValue: null,
            });
        }
    },
    async down(queryInterface) {
        const tableDesc = await queryInterface.describeTable('visaOrders');
        if (tableDesc.product_breakup) {
            await queryInterface.removeColumn('visaOrders', 'product_breakup');
        }
    },
};
