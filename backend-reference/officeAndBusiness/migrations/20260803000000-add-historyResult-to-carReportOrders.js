'use strict';

// The normalised Vehicle History (Droom §4) result, sibling to `valuationBands` /
// `valuationSpec`. Written when a BUILDING history order is first opened — the RC lookup
// is not run before payment, because that lookup IS the report.
//
// The raw vendor body still goes to the pre-existing `vendorResponse` TEXT column, so the
// fields Droom returns but the reference doc never named (chassis/engine, RC expiry,
// owner address) survive for a richer card later without re-purchasing reports.
//
// Guarded rather than bare: officeAndBusiness and payment migrate the same database, and
// `sequelize.sync({force:false})` may already have added the column at boot.
const TABLE = 'carReportOrders';
const COLUMN = 'historyResult';

// null = the table itself is absent, so there is nothing to add or remove either way.
const hasColumn = async (queryInterface) => {
    try {
        const table = await queryInterface.describeTable(TABLE);
        return Object.prototype.hasOwnProperty.call(table, COLUMN);
    } catch (error) {
        return null;
    }
};

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        if ((await hasColumn(queryInterface)) !== false) return;
        await queryInterface.addColumn(TABLE, COLUMN, {
            type: Sequelize.JSON,
            allowNull: true,
            after: 'valuationSpec',
        });
    },

    async down(queryInterface) {
        if ((await hasColumn(queryInterface)) === true) {
            await queryInterface.removeColumn(TABLE, COLUMN);
        }
    },
};
