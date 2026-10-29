'use strict';

// The vendor returns a single `price` (stored as vendorPrice), so marketPrice was
// always 0 and is unused — drop it. Guarded + idempotent so re-runs are no-ops.
module.exports = {
    up: async queryInterface => {
        let table;
        try {
            table = await queryInterface.describeTable('businessRegistrationCatalogs');
        } catch (err) {
            return; // table not created yet
        }
        if (table.marketPrice) {
            await queryInterface.removeColumn('businessRegistrationCatalogs', 'marketPrice');
        }
    },

    down: async (queryInterface, Sequelize) => {
        let table;
        try {
            table = await queryInterface.describeTable('businessRegistrationCatalogs');
        } catch (err) {
            return;
        }
        if (!table.marketPrice) {
            await queryInterface.addColumn('businessRegistrationCatalogs', 'marketPrice', {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0,
            });
        }
    },
};
