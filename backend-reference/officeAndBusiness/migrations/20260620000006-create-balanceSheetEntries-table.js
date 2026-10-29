'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const tables = await queryInterface.showAllTables();
        const names = tables.map((t) => (typeof t === 'string' ? t : t.tableName));

        if (!names.includes('balanceSheetEntries')) {
            await queryInterface.createTable('balanceSheetEntries', {
                id: {
                    type: Sequelize.BIGINT,
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false,
                },
                corporateUserId: {
                    type: Sequelize.BIGINT,
                    allowNull: true,
                },
                subCorporateUserId: {
                    type: Sequelize.BIGINT,
                    allowNull: true,
                },
                // Which balance-sheet section this head belongs to.
                section: {
                    type: Sequelize.ENUM(
                        'currentAssets',
                        'nonCurrentAssets',
                        'currentLiabilities',
                        'longTermLiabilities',
                        'equity'
                    ),
                    allowNull: false,
                },
                // Display name of the line item (e.g. "Plant & Machinery").
                head: {
                    type: Sequelize.STRING,
                    allowNull: false,
                },
                // Signed balance; may be negative for contra heads (e.g. Accumulated Depreciation).
                amount: {
                    type: Sequelize.DECIMAL(14, 2),
                    allowNull: false,
                    defaultValue: 0,
                },
                // Balance date; the report snapshots the latest entry per head with asOfDate <= as-of.
                asOfDate: {
                    type: Sequelize.DATEONLY,
                    allowNull: false,
                },
                note: {
                    type: Sequelize.TEXT,
                    allowNull: true,
                    defaultValue: null,
                },
                isActive: {
                    type: Sequelize.BOOLEAN,
                    allowNull: false,
                    defaultValue: true,
                },
                createdAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                },
                updatedAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                },
                deletedAt: {
                    type: Sequelize.DATE,
                    allowNull: true,
                    defaultValue: null,
                },
            });
        }

        const addIndex = async (fields) => {
            try {
                await queryInterface.addIndex('balanceSheetEntries', fields);
            } catch (err) {
                // index already exists (created by sync) — safe to ignore
            }
        };
        await addIndex(['corporateUserId']);
        await addIndex(['corporateUserId', 'section']);
        await addIndex(['corporateUserId', 'asOfDate']);
    },

    async down(queryInterface) {
        await queryInterface.dropTable('balanceSheetEntries');
    },
};
