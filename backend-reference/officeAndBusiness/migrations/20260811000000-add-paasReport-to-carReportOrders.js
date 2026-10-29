'use strict';

// Where the finished Valuation PDF lives, written when Droom's async PaaS report
// completes (webhook, or the read-time status poll). `reportUrl` is the full vendor CDN
// link the customer downloads; `reportPath` is the vendor-relative path kept so the file
// can be re-resolved (or copied to S3) if the CDN host ever changes.
//
// Guarded rather than bare: officeAndBusiness and payment migrate the same database, and
// `sequelize.sync({force:false})` may already have added the columns at boot.
const TABLE = 'carReportOrders';
const COLUMNS = ['reportUrl', 'reportPath'];

// null = the table itself is absent, so there is nothing to add or remove either way.
const hasColumn = async (queryInterface, column) => {
    try {
        const table = await queryInterface.describeTable(TABLE);
        return Object.prototype.hasOwnProperty.call(table, column);
    } catch (error) {
        return null;
    }
};

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        for (const column of COLUMNS) {
            if ((await hasColumn(queryInterface, column)) !== false) continue;
            await queryInterface.addColumn(TABLE, column, {
                type: Sequelize.STRING(500),
                allowNull: true,
                after: 'inspectionBooking',
            });
        }
    },

    async down(queryInterface) {
        for (const column of COLUMNS) {
            if ((await hasColumn(queryInterface, column)) === true) {
                await queryInterface.removeColumn(TABLE, column);
            }
        }
    },
};
