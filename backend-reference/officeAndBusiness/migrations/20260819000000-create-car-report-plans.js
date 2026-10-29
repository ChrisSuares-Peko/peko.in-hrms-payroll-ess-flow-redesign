'use strict';

// Admin-managed Car Report pricing: one row per sellable product (valuation, history,
// and one per inspection package). Replaces the hardcoded price/product-code maps in
// utils/carReport.js, which remain only as a fallback when this table is unreachable.
// Seeded with the launch values; an inspection row with no vendorProductCode cannot be
// booked with Droom and auto-refunds — codes are pasted in via the admin panel.
const TABLE = 'carReportPlans';

// Self Inspection is the only inspection product Droom offers us today — more packages
// get added via the admin panel if the vendor ever provides their product codes.
// The challan_* rows are not sellable products: their price is the ADDITIONAL fee added
// on top of the Traffic Challan surcharge per challan of that kind (ticket 30069) —
// seeded 0 so nothing changes until an admin configures them.
const SEED_ROWS = [
    { reportType: 'valuation', packageId: null, displayName: 'Valuation Report', price: 199, vendorProductCode: null, sortOrder: 1 },
    { reportType: 'history', packageId: null, displayName: 'Vehicle History Report', price: 129, vendorProductCode: null, sortOrder: 2 },
    { reportType: 'inspection', packageId: 'basic', displayName: 'Self Inspection', price: 599, vendorProductCode: 'self_inspection_tkm_insurance_ai', sortOrder: 3 },
    { reportType: 'challan_online', packageId: null, displayName: 'Online Challan Fee', price: 0, vendorProductCode: null, sortOrder: 10 },
    { reportType: 'challan_court', packageId: null, displayName: 'Court Challan Fee', price: 0, vendorProductCode: null, sortOrder: 11 },
];

const tableExists = async (queryInterface) => {
    try {
        await queryInterface.describeTable(TABLE);
        return true;
    } catch (error) {
        return false;
    }
};

const INDEX_NAME = 'car_report_plans_report_type_package_id';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        if (!(await tableExists(queryInterface))) {
            await queryInterface.createTable(TABLE, {
                id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
                reportType: { type: Sequelize.STRING(20), allowNull: false },
                packageId: { type: Sequelize.STRING(40), allowNull: true },
                displayName: { type: Sequelize.STRING, allowNull: false },
                price: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
                vendorProductCode: { type: Sequelize.STRING, allowNull: true },
                status: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
                sortOrder: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
                createdAt: { type: Sequelize.DATE, allowNull: false },
                updatedAt: { type: Sequelize.DATE, allowNull: false },
            });
        }

        // Separate from the create branch: sequelize.sync at boot can create the table
        // (from the entity) before this migration runs, which would otherwise skip the
        // index forever.
        const indexes = await queryInterface.showIndex(TABLE);
        if (!indexes.some((i) => i.name === INDEX_NAME)) {
            await queryInterface.addIndex(TABLE, ['reportType', 'packageId'], { name: INDEX_NAME });
        }

        const [rows] = await queryInterface.sequelize.query(`SELECT COUNT(*) AS n FROM ${TABLE}`);
        if (Number(rows[0].n) > 0) return;

        const now = new Date();
        await queryInterface.bulkInsert(
            TABLE,
            SEED_ROWS.map((row) => ({ ...row, status: true, createdAt: now, updatedAt: now }))
        );
    },

    async down(queryInterface) {
        if (await tableExists(queryInterface)) {
            await queryInterface.dropTable(TABLE);
        }
    },
};
