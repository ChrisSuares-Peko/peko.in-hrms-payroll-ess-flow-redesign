'use strict';

const TABLE = 'settings';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const tables = await queryInterface.showAllTables();
        if (tables.map((t) => (typeof t === 'string' ? t : t.tableName)).includes(TABLE)) return;

        await queryInterface.createTable(TABLE, {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
            name: { type: Sequelize.STRING(100), allowNull: false, unique: true },
            details: { type: Sequelize.JSON, allowNull: true },
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
    },

    down: async (queryInterface) => {
        const tables = await queryInterface.showAllTables();
        if (tables.map((t) => (typeof t === 'string' ? t : t.tableName)).includes(TABLE)) {
            await queryInterface.dropTable(TABLE);
        }
    },
};
