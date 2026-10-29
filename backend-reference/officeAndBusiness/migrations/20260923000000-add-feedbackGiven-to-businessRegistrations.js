'use strict';

// Adds businessRegistrations.feedbackGiven — true once RM feedback is submitted
// (gates the FE modal per application). Guarded + idempotent.

module.exports = {
    async up(queryInterface, Sequelize) {
        let table;
        try {
            table = await queryInterface.describeTable('businessRegistrations');
        } catch (err) {
            // No table yet — sequelize.sync creates it with the column.
            return;
        }
        if (!table.feedbackGiven) {
            await queryInterface.addColumn('businessRegistrations', 'feedbackGiven', {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            });
        }
    },

    async down(queryInterface) {
        let table;
        try {
            table = await queryInterface.describeTable('businessRegistrations');
        } catch (err) {
            return;
        }
        if (!table.feedbackGiven) return;
        await queryInterface.removeColumn('businessRegistrations', 'feedbackGiven');
    },
};
