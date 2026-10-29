'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        const tableDesc = await queryInterface.describeTable('visaOrders');
        if (!tableDesc.visaCategory) {
            await queryInterface.addColumn('visaOrders', 'visaCategory', {
                type: Sequelize.STRING,
                allowNull: true,
            });
        }
    },
    async down(queryInterface) {
        const tableDesc = await queryInterface.describeTable('visaOrders');
        if (tableDesc.visaCategory) {
            await queryInterface.removeColumn('visaOrders', 'visaCategory');
        }
    },
};
