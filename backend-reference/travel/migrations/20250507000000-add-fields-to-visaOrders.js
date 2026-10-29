'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        const tableDesc = await queryInterface.describeTable('visaOrders');

        if (!tableDesc.destination) {
            await queryInterface.addColumn('visaOrders', 'destination', {
                type: Sequelize.STRING,
                allowNull: true,
            });
        }

        if (!tableDesc.visaFormat) {
            await queryInterface.addColumn('visaOrders', 'visaFormat', {
                type: Sequelize.STRING,
                allowNull: true,
            });
        }
    },

    async down(queryInterface) {
        const tableDesc = await queryInterface.describeTable('visaOrders');
        if (tableDesc.destination) await queryInterface.removeColumn('visaOrders', 'destination');
        if (tableDesc.visaFormat)  await queryInterface.removeColumn('visaOrders', 'visaFormat');
    },
};
