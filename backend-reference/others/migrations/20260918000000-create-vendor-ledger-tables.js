"use strict";

const DEPOSITS = "vendorDeposits";
const CREDIT_NOTES = "vendorCreditNotes";

const auditColumns = Sequelize => ({
    recordedById: { type: Sequelize.BIGINT, allowNull: true },
    recordedByName: { type: Sequelize.STRING, allowNull: true },
    voidedById: { type: Sequelize.BIGINT, allowNull: true },
    voidedByName: { type: Sequelize.STRING, allowNull: true },
    voidedAt: { type: Sequelize.DATE, allowNull: true },
    voidReason: { type: Sequelize.TEXT, allowNull: true },
    createdAt: { type: Sequelize.DATE, allowNull: false },
    updatedAt: { type: Sequelize.DATE, allowNull: false },
});

module.exports = {
    async up(queryInterface, Sequelize) {
        const hasDeposits = await queryInterface.tableExists(DEPOSITS);
        if (!hasDeposits) {
            await queryInterface.createTable(DEPOSITS, {
                id: {
                    type: Sequelize.BIGINT,
                    autoIncrement: true,
                    primaryKey: true,
                    allowNull: false,
                },
                vendorId: { type: Sequelize.BIGINT, allowNull: true },
                amount: { type: Sequelize.DECIMAL(12, 4), allowNull: false, defaultValue: 0.0 },
                depositDate: { type: Sequelize.DATEONLY, allowNull: false },
                reference: { type: Sequelize.STRING(40), allowNull: false },
                mode: {
                    type: Sequelize.ENUM("NEFT", "RTGS", "IMPS", "UPI", "CHEQUE", "OTHER"),
                    allowNull: false,
                    defaultValue: "NEFT",
                },
                note: { type: Sequelize.TEXT, allowNull: true },
                status: {
                    type: Sequelize.ENUM("ACTIVE", "VOIDED"),
                    allowNull: false,
                    defaultValue: "ACTIVE",
                },
                ...auditColumns(Sequelize),
            });
            await queryInterface.addIndex(DEPOSITS, ["vendorId", "depositDate"], {
                name: "vendorDeposits_vendorId_depositDate",
            });
        }

        const hasCreditNotes = await queryInterface.tableExists(CREDIT_NOTES);
        if (!hasCreditNotes) {
            await queryInterface.createTable(CREDIT_NOTES, {
                id: {
                    type: Sequelize.BIGINT,
                    autoIncrement: true,
                    primaryKey: true,
                    allowNull: false,
                },
                vendorId: { type: Sequelize.BIGINT, allowNull: true },
                creditNoteNumber: { type: Sequelize.STRING(40), allowNull: false },
                amount: { type: Sequelize.DECIMAL(12, 4), allowNull: false, defaultValue: 0.0 },
                issueDate: { type: Sequelize.DATEONLY, allowNull: false },
                reason: { type: Sequelize.TEXT, allowNull: true },
                againstCorporateTxnId: { type: Sequelize.STRING, allowNull: true },
                status: {
                    type: Sequelize.ENUM("OPEN", "APPLIED", "VOIDED"),
                    allowNull: false,
                    defaultValue: "OPEN",
                },
                appliedAt: { type: Sequelize.DATE, allowNull: true },
                appliedById: { type: Sequelize.BIGINT, allowNull: true },
                appliedByName: { type: Sequelize.STRING, allowNull: true },
                ...auditColumns(Sequelize),
            });
            await queryInterface.addIndex(CREDIT_NOTES, ["vendorId", "issueDate"], {
                name: "vendorCreditNotes_vendorId_issueDate",
            });
        }
    },

    async down(queryInterface) {
        const hasCreditNotes = await queryInterface.tableExists(CREDIT_NOTES);
        if (hasCreditNotes) await queryInterface.dropTable(CREDIT_NOTES);

        const hasDeposits = await queryInterface.tableExists(DEPOSITS);
        if (hasDeposits) await queryInterface.dropTable(DEPOSITS);
    },
};
