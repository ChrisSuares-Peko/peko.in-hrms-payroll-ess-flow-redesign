'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        const tableDesc = await queryInterface.describeTable('visaOrders');
        if (!tableDesc.actualAmountPaid) {
            await queryInterface.addColumn('visaOrders', 'actualAmountPaid', {
                type: Sequelize.DECIMAL(12, 4),
                allowNull: true,
                defaultValue: null,
            });
        }
    },
    async down(queryInterface) {
        const tableDesc = await queryInterface.describeTable('visaOrders');
        if (tableDesc.actualAmountPaid) {
            await queryInterface.removeColumn('visaOrders', 'actualAmountPaid');
        }
    },
};
