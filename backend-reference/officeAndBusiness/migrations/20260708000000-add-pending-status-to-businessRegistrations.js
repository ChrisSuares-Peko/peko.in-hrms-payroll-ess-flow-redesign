'use strict';

// Adds 'PENDING' (pre-payment draft) to businessRegistrations.status and makes it
// the default. Guarded + idempotent: safe when the table doesn't exist yet
// (sequelize.sync creates it with the full enum) or when re-run.

const FULL_ENUM = ['PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'];

module.exports = {
    async up(queryInterface, Sequelize) {
        let table;
        try {
            table = await queryInterface.describeTable('businessRegistrations');
        } catch (err) {
            return;
        }
        if (!table.status) return;
        // Re-run safe: changing to the same enum definition is a no-op alter.
        await queryInterface.changeColumn('businessRegistrations', 'status', {
            type: Sequelize.ENUM(...FULL_ENUM),
            defaultValue: 'PENDING',
        });
    },

    async down(queryInterface, Sequelize) {
        let table;
        try {
            table = await queryInterface.describeTable('businessRegistrations');
        } catch (err) {
            return;
        }
        if (!table.status) return;
        // Move any PENDING rows to SUBMITTED before narrowing the enum.
        await queryInterface.sequelize.query(
            "UPDATE `businessRegistrations` SET status = 'SUBMITTED' WHERE status = 'PENDING'"
        );
        await queryInterface.changeColumn('businessRegistrations', 'status', {
            type: Sequelize.ENUM('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'),
            defaultValue: 'SUBMITTED',
        });
    },
};
