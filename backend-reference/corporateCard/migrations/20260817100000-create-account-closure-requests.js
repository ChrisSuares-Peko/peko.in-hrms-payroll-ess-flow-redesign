'use strict';

const TABLE = 'corporateCardAccountClosureRequests';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const tables = await queryInterface.showAllTables();
        if (tables.includes(TABLE)) return;

        await queryInterface.createTable(TABLE, {
            id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
            corporateId: { type: Sequelize.INTEGER, allowNull: false },
            status: { type: Sequelize.STRING, allowNull: false, defaultValue: 'PENDING' },
            reason: { type: Sequelize.STRING, allowNull: false },
            details: { type: Sequelize.TEXT, allowNull: true },
            requestedByCredentialId: { type: Sequelize.INTEGER, allowNull: true },
            requestedByName: { type: Sequelize.STRING, allowNull: true },
            decidedByCredentialId: { type: Sequelize.INTEGER, allowNull: true },
            decidedAt: { type: Sequelize.DATE, allowNull: true },
            decisionNote: { type: Sequelize.TEXT, allowNull: true },
            createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
            updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        }, { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

        await queryInterface.addIndex(TABLE, ['corporateId', 'status'], {
            name: 'ccClosure_corporate_status',
        });
    },

    down: async (queryInterface) => {
        const tables = await queryInterface.showAllTables();
        if (tables.includes(TABLE)) {
            await queryInterface.dropTable(TABLE);
        }
    },
};
