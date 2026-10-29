'use strict';

const TABLE = 'cardInAppPayments';

const INDEXES = [
    { fields: ['paymentRefId'], unique: true, name: 'cardInAppPayments_paymentRefId_unique' },
    { fields: ['cardIssuanceId', 'createdAt'], unique: false, name: 'cardInAppPayments_card_created_idx' },
    { fields: ['status', 'createdAt'], unique: false, name: 'cardInAppPayments_status_created_idx' },
];

const tableNames = (tables) => tables.map((t) => (typeof t === 'string' ? t : t.tableName));

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const exists = tableNames(await queryInterface.showAllTables()).includes(TABLE);

        if (!exists) {
            await queryInterface.createTable(TABLE, {
                id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
                corporateId: { type: Sequelize.INTEGER, allowNull: false },
                cardIssuanceId: { type: Sequelize.BIGINT, allowNull: false },
                userId: { type: Sequelize.BIGINT, allowNull: true },
                credentialId: { type: Sequelize.INTEGER, allowNull: true },
                paymentRefId: { type: Sequelize.STRING(64), allowNull: false },
                accessKey: { type: Sequelize.STRING(64), allowNull: true },
                amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
                invoiceNumber: { type: Sequelize.STRING(15), allowNull: true },
                status: { type: Sequelize.STRING(24), allowNull: false, defaultValue: 'INITIATED' },
                reason: { type: Sequelize.STRING(255), allowNull: true },
                vendorTransactionId: { type: Sequelize.BIGINT, allowNull: true },
                vendorBatchNumber: { type: Sequelize.BIGINT, allowNull: true },
                approvalCode: { type: Sequelize.STRING(32), allowNull: true },
                appUtr: { type: Sequelize.STRING(64), allowNull: true },
                balanceAfter: { type: Sequelize.DECIMAL(14, 2), allowNull: true },
                vendorResponseCode: { type: Sequelize.INTEGER, allowNull: true },
                jitTransactionUniqueId: { type: Sequelize.BIGINT, allowNull: true },
                cancelTransactionId: { type: Sequelize.BIGINT, allowNull: true },
                cancelBatchNumber: { type: Sequelize.BIGINT, allowNull: true },
                cancelledAt: { type: Sequelize.DATE, allowNull: true },
                reversedAt: { type: Sequelize.DATE, allowNull: true },
                rawRedeemResponse: { type: Sequelize.JSON, allowNull: true },
                rawCancelResponse: { type: Sequelize.JSON, allowNull: true },
                createdAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
                },
                updatedAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
                },
            });
        }

        const present = (await queryInterface.showIndex(TABLE)).map((i) => i.name);
        for (const index of INDEXES) {
            if (present.includes(index.name)) continue;
            await queryInterface.addIndex(TABLE, index.fields, { unique: index.unique, name: index.name });
        }
    },

    down: async (queryInterface) => {
        if (tableNames(await queryInterface.showAllTables()).includes(TABLE)) {
            await queryInterface.dropTable(TABLE);
        }
    },
};
