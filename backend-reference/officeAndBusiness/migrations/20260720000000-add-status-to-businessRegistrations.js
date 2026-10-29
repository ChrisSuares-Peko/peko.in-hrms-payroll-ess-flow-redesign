'use strict';

// Adds businessRegistrations.status. The column lives on the entity, but the app
// creates the table via sequelize.sync({ force: false }) — which never adds
// columns to a table that already exists. So an environment whose table predates
// `status` is missing it (MySQL "Unknown column 'status'"), breaking both the app
// and the submittedAt backfill. Guarded + idempotent: adds it only when absent,
// matching the entity (ENUM + default PENDING). Table-missing case is left to sync.

const STATUS_ENUM = ['PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'];

module.exports = {
    async up(queryInterface, Sequelize) {
        let table;
        try {
            table = await queryInterface.describeTable('businessRegistrations');
        } catch (err) {
            return;
        }
        if (table.status) return;
        await queryInterface.addColumn('businessRegistrations', 'status', {
            type: Sequelize.ENUM(...STATUS_ENUM),
            defaultValue: 'PENDING',
        });
    },

    async down(queryInterface) {
        let table;
        try {
            table = await queryInterface.describeTable('businessRegistrations');
        } catch (err) {
            return;
        }
        if (!table.status) return;
        await queryInterface.removeColumn('businessRegistrations', 'status');
    },
};
