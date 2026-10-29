'use strict';

// The doorstep-inspection booking (Droom §5) — sibling to `valuationBands`/`valuationSpec`
// and `historyResult`. Holds the normalised { slot1, slot2?, address } the order-detail
// card renders.
//
// Unlike the other two this is pure input, captured at purchase: Droom returns no booking
// body, so there is nothing to fetch back. The raw vendor response still goes to the
// pre-existing `vendorResponse` TEXT column, and `vendorReference` doubles as the
// dispatched-to-Droom marker (null = paid for but not yet booked).
//
// Guarded rather than bare: officeAndBusiness and payment migrate the same database, and
// `sequelize.sync({force:false})` may already have added the column at boot.
const TABLE = 'carReportOrders';
const COLUMN = 'inspectionBooking';

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
            after: 'historyResult',
        });
    },

    async down(queryInterface) {
        if ((await hasColumn(queryInterface)) === true) {
            await queryInterface.removeColumn(TABLE, COLUMN);
        }
    },
};
