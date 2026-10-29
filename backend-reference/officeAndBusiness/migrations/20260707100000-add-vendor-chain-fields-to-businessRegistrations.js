'use strict';

// Adds the IndiaFilings create-chain tracking fields (v1.1 doc) + the uploaded
// documents store to businessRegistrations. Guarded per-column, mirroring
// 20260430000001-add-vendor-fields-to-companyIncorporations.js.

const COLUMNS = Sequelize => ({
    vendorLeadId: { type: Sequelize.STRING, allowNull: true },
    vendorGid: { type: Sequelize.STRING, allowNull: true },
    vendorEngagementId: { type: Sequelize.STRING, allowNull: true },
    vendorPeople: { type: Sequelize.JSON, allowNull: true },
    vendorShareholdings: { type: Sequelize.JSON, allowNull: true },
    vendorStages: { type: Sequelize.JSON, allowNull: true },
    vendorError: { type: Sequelize.TEXT, allowNull: true },
    vendorAttempts: { type: Sequelize.INTEGER, defaultValue: 0 },
    vendorSentAt: { type: Sequelize.DATE, allowNull: true },
    documents: { type: Sequelize.JSON, allowNull: true },
});

module.exports = {
    async up(queryInterface, Sequelize) {
        let table;
        try {
            table = await queryInterface.describeTable('businessRegistrations');
        } catch (err) {
            // Table does not exist yet — sequelize.sync will create it with all columns.
            return;
        }

        const columns = COLUMNS(Sequelize);
        for (const [name, definition] of Object.entries(columns)) {
            if (!table[name]) {
                await queryInterface.addColumn('businessRegistrations', name, definition);
            }
        }
    },

    async down(queryInterface, Sequelize) {
        let table;
        try {
            table = await queryInterface.describeTable('businessRegistrations');
        } catch (err) {
            return;
        }

        const columns = COLUMNS(Sequelize);
        for (const name of Object.keys(columns).reverse()) {
            if (table[name]) {
                await queryInterface.removeColumn('businessRegistrations', name);
            }
        }
    },
};
