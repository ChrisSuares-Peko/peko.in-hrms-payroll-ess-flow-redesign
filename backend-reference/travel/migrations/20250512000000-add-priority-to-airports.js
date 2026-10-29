'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        const tables = await queryInterface.showAllTables();
        if (!tables.includes('airports')) return;

        const columns = await queryInterface.describeTable('airports');
        if (columns.priority) return;

        await queryInterface.addColumn('airports', 'priority', {
            type: Sequelize.INTEGER,
            allowNull: true,
            defaultValue: null,
            after: 'countryName',
        });
    },

    async down(queryInterface) {
        const tables = await queryInterface.showAllTables();
        if (!tables.includes('airports')) return;

        const columns = await queryInterface.describeTable('airports');
        if (!columns.priority) return;

        await queryInterface.removeColumn('airports', 'priority');
    },
};
