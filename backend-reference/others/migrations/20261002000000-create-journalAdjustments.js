"use strict";

const TABLE = "journalAdjustments";

module.exports = {
    async up(queryInterface, Sequelize) {
        const exists = await queryInterface.tableExists(TABLE);
        if (exists) return;

        await queryInterface.createTable(TABLE, {
            id: {
                type: Sequelize.BIGINT,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false,
            },
            corporateTxnId: { type: Sequelize.STRING, allowNull: false },
            journalKey: { type: Sequelize.STRING(32), allowNull: false },
            action: {
                type: Sequelize.ENUM("RECORDED", "UPDATED", "REVERSED_REPOSTED"),
                allowNull: false,
            },
            journalDate: { type: Sequelize.DATEONLY, allowNull: true },
            reason: { type: Sequelize.TEXT, allowNull: false },
            splitBefore: { type: Sequelize.JSON, allowNull: true },
            splitAfter: { type: Sequelize.JSON, allowNull: true },
            lineItemsBefore: { type: Sequelize.JSON, allowNull: true },
            lineItemsAfter: { type: Sequelize.JSON, allowNull: true },
            providerJournalId: { type: Sequelize.STRING, allowNull: true },
            previousProviderJournalId: { type: Sequelize.STRING, allowNull: true },
            reversedJournalId: { type: Sequelize.STRING, allowNull: true },
            result: { type: Sequelize.ENUM("POSTED", "FAILED"), allowNull: false },
            failureReason: { type: Sequelize.TEXT, allowNull: true },
            recordedById: { type: Sequelize.BIGINT, allowNull: true },
            recordedByName: { type: Sequelize.STRING, allowNull: true },
            createdAt: { type: Sequelize.DATE, allowNull: false },
            updatedAt: { type: Sequelize.DATE, allowNull: false },
        });
        await queryInterface.addIndex(TABLE, ["corporateTxnId", "journalKey"], {
            name: "journalAdjustments_txn_key",
        });
    },

    async down(queryInterface) {
        const exists = await queryInterface.tableExists(TABLE);
        if (exists) await queryInterface.dropTable(TABLE);
    },
};
