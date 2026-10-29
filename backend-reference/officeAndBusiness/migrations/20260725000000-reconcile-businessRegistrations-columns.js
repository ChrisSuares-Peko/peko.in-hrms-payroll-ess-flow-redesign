'use strict';

// Reconcile businessRegistrations to the entity model. The table is created by
// sequelize.sync (there is no create-table migration), and sync never alters an
// existing table — so any column added to the model AFTER a table was first
// created is missing on that DB (e.g. prod was missing `status`, and `vendorStatus`
// / `vendorApplicationId` were never in a migration at all). This adds EVERY model
// column that is absent, so the table always matches the model.
//
// Guarded + idempotent: describeTable first (table-missing → sync owns it), then
// addColumn only when the column is absent — safe to run/re-run in every env.
// down() is a deliberate no-op: these are the table's own columns, so dropping
// them on a rollback would be destructive.

// Every column here is nullable or has a default, so addColumn is safe even on a
// table with existing rows (no "field doesn't have a default value" in strict
// mode). The 3 core NOT NULL / no-default columns (id, applicationId, entityType,
// applicationData) are intentionally EXCLUDED — they exist from table creation
// (every query uses them), so they never need reconciling and can't be added
// safely to a populated table anyway.
const COLUMNS = Sequelize => ({
    businessName: { type: Sequelize.STRING, allowNull: true },
    contactPerson: { type: Sequelize.STRING, allowNull: true },
    contactEmail: { type: Sequelize.STRING, allowNull: true },
    contactMobile: { type: Sequelize.STRING, allowNull: true },
    incorporationFee: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    gstAmount: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    totalAmount: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    status: {
        type: Sequelize.ENUM('PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'),
        defaultValue: 'PENDING',
    },
    submittedAt: { type: Sequelize.DATE, allowNull: true },
    paymentStatus: {
        type: Sequelize.ENUM('PENDING', 'COMPLETED', 'FAILED'),
        defaultValue: 'PENDING',
    },
    corporateTxnId: { type: Sequelize.STRING, allowNull: true },
    paymentId: { type: Sequelize.STRING, allowNull: true },
    paidAt: { type: Sequelize.DATE, allowNull: true },
    vendorStatus: {
        type: Sequelize.ENUM('NOT_SENT', 'SENDING', 'SENT', 'FAILED'),
        defaultValue: 'NOT_SENT',
    },
    vendorLeadId: { type: Sequelize.STRING, allowNull: true },
    vendorGid: { type: Sequelize.STRING, allowNull: true },
    vendorApplicationId: { type: Sequelize.STRING, allowNull: true },
    vendorEngagementId: { type: Sequelize.STRING, allowNull: true },
    vendorPeople: { type: Sequelize.JSON, allowNull: true },
    vendorShareholdings: { type: Sequelize.JSON, allowNull: true },
    vendorStages: { type: Sequelize.JSON, allowNull: true },
    vendorError: { type: Sequelize.TEXT, allowNull: true },
    vendorAttempts: { type: Sequelize.INTEGER, defaultValue: 0 },
    vendorSentAt: { type: Sequelize.DATE, allowNull: true },
    srn: { type: Sequelize.STRING, allowNull: true },
    documents: { type: Sequelize.JSON, allowNull: true },
    rejectionReason: { type: Sequelize.TEXT, allowNull: true },
    notes: { type: Sequelize.TEXT, allowNull: true },
});

module.exports = {
    async up(queryInterface, Sequelize) {
        let table;
        try {
            table = await queryInterface.describeTable('businessRegistrations');
        } catch (err) {
            // Table doesn't exist yet — sequelize.sync creates it with all columns.
            return;
        }

        const columns = COLUMNS(Sequelize);
        for (const [name, definition] of Object.entries(columns)) {
            if (!table[name]) {
                await queryInterface.addColumn('businessRegistrations', name, definition);
            }
        }
    },

    async down() {
        // No-op: these are the table's own columns; dropping them on a rollback
        // would be destructive. Nothing to reverse.
    },
};
