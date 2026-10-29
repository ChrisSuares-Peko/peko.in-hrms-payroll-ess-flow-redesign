'use strict';

const TABLE = 'savedTravellers';

module.exports = {
    async up(queryInterface, Sequelize) {
        const tables = await queryInterface.showAllTables();
        const normalized = tables.map((t) => (typeof t === 'string' ? t : t.tableName));
        if (normalized.includes(TABLE)) return;

        await queryInterface.createTable(
            TABLE,
            {
                id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
                credentialId: {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                    references: { model: 'credentials', key: 'id' },
                    onUpdate: 'CASCADE',
                    onDelete: 'SET NULL',
                },
                type: { type: Sequelize.STRING, allowNull: false },
                subCorporateUserId: { type: Sequelize.INTEGER, allowNull: true },
                title: { type: Sequelize.STRING, allowNull: true },
                firstName: { type: Sequelize.STRING, allowNull: false },
                lastName: { type: Sequelize.STRING, allowNull: false },
                gender: { type: Sequelize.STRING, allowNull: true },
                paxType: { type: Sequelize.INTEGER, allowNull: true },
                dateOfBirth: { type: Sequelize.DATEONLY, allowNull: true },
                passportNo: { type: Sequelize.STRING, allowNull: true },
                passportExpiry: { type: Sequelize.DATEONLY, allowNull: true },
                passportIssueDate: { type: Sequelize.DATEONLY, allowNull: true },
                passportIssueCountryCode: { type: Sequelize.STRING, allowNull: true },
                addressLine1: { type: Sequelize.STRING, allowNull: true },
                addressLine2: { type: Sequelize.STRING, allowNull: true },
                city: { type: Sequelize.STRING, allowNull: true },
                cellCountryCode: { type: Sequelize.STRING, allowNull: true, defaultValue: '+91' },
                contactNo: { type: Sequelize.STRING, allowNull: true },
                email: { type: Sequelize.STRING, allowNull: true },
                nationality: { type: Sequelize.STRING, allowNull: true, defaultValue: 'IN' },
                countryCode: { type: Sequelize.STRING, allowNull: true, defaultValue: 'IN' },
                countryName: { type: Sequelize.STRING, allowNull: true, defaultValue: 'India' },
                pan: { type: Sequelize.STRING, allowNull: true },
                status: { type: Sequelize.ENUM('ACTIVE', 'INACTIVE'), defaultValue: 'ACTIVE' },
                createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
                updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
            },
            { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' }
        );

        await queryInterface.addIndex(TABLE, ['credentialId', 'type'], {
            name: 'savedTravellers_credentialId_type_idx',
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable(TABLE);
    },
};
