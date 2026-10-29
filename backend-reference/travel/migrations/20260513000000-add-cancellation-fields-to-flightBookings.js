'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        const tables = await queryInterface.showAllTables();
        if (!tables.includes('flightBookings')) return;

        const columns = await queryInterface.describeTable('flightBookings');

        if (!columns.cancellationDate) {
            await queryInterface.addColumn('flightBookings', 'cancellationDate', {
                type: Sequelize.DATE,
                allowNull: true,
                after: 'changeRequestId',
            });
        }

        if (!columns.refundedAmount) {
            await queryInterface.addColumn('flightBookings', 'refundedAmount', {
                type: Sequelize.DECIMAL(12, 2),
                allowNull: true,
                after: 'cancellationDate',
            });
        }
    },

    async down(queryInterface) {
        const tables = await queryInterface.showAllTables();
        if (!tables.includes('flightBookings')) return;

        const columns = await queryInterface.describeTable('flightBookings');

        if (columns.refundedAmount) {
            await queryInterface.removeColumn('flightBookings', 'refundedAmount');
        }

        if (columns.cancellationDate) {
            await queryInterface.removeColumn('flightBookings', 'cancellationDate');
        }
    },
};
