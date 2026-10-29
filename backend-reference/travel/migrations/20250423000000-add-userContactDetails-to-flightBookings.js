'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        const tables = await queryInterface.showAllTables();
        if (!tables.includes('flightBookings')) return;

        const columns = await queryInterface.describeTable('flightBookings');
        if (columns.userContactDetails) return;

        await queryInterface.addColumn('flightBookings', 'userContactDetails', {
            type: Sequelize.JSON,
            allowNull: true,
            defaultValue: {},
            after: 'fare',
        });
    },

    async down(queryInterface) {
        const tables = await queryInterface.showAllTables();
        if (!tables.includes('flightBookings')) return;

        const columns = await queryInterface.describeTable('flightBookings');
        if (!columns.userContactDetails) return;

        await queryInterface.removeColumn('flightBookings', 'userContactDetails');
    },
};
