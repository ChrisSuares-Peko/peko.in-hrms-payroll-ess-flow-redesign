'use strict';

// Adds businessRegistrations.submittedAt — when the final submit happened
// (createdAt is the draft-creation date, so tracking needs its own stamp).
// Guarded + idempotent: safe when the table doesn't exist yet (sequelize.sync
// creates it with the column) or when re-run.

module.exports = {
    async up(queryInterface, Sequelize) {
        let table;
        try {
            table = await queryInterface.describeTable('businessRegistrations');
        } catch (err) {
            // Table doesn't exist yet — sequelize.sync creates it WITH the
            // column (it's in the entity), nothing to do.
            return;
        }
        if (!table.submittedAt) {
            await queryInterface.addColumn('businessRegistrations', 'submittedAt', {
                type: Sequelize.DATE,
                allowNull: true,
            });
        }
        // Backfill existing submitted rows with their last-update time — the
        // closest stamp we have for when they were filed. NULL-scoped so a rerun
        // completes safely. Guarded on `status`: older tables that predate the
        // status column (added by the 20260720 migration) have nothing to backfill.
        if (table.status) {
            await queryInterface.sequelize.query(
                "UPDATE `businessRegistrations` SET submittedAt = updatedAt WHERE status != 'PENDING' AND submittedAt IS NULL"
            );
        }
    },

    async down(queryInterface) {
        let table;
        try {
            table = await queryInterface.describeTable('businessRegistrations');
        } catch (err) {
            return;
        }
        if (!table.submittedAt) return;
        await queryInterface.removeColumn('businessRegistrations', 'submittedAt');
    },
};
