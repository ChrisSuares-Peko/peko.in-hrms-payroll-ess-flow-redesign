'use strict';

// Ticket 31321: per-vehicle "Refresh" hits the paid vendor RC API, so the last refresh time is
// persisted per fleet and the action is capped at once a week.
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        let table;
        try {
            table = await queryInterface.describeTable('garage_fleets');
        } catch (err) {
            return;
        }
        if (!table.lastRefreshedAt) {
            await queryInterface.addColumn('garage_fleets', 'lastRefreshedAt', {
                type: Sequelize.DATE,
                allowNull: true,
                defaultValue: null,
            });
        }
    },

    async down(queryInterface) {
        let table;
        try {
            table = await queryInterface.describeTable('garage_fleets');
        } catch (err) {
            return;
        }
        if (table.lastRefreshedAt) {
            await queryInterface.removeColumn('garage_fleets', 'lastRefreshedAt');
        }
    },
};
