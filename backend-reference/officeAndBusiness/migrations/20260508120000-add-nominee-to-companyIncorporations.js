'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        let table;
        try {
            table = await queryInterface.describeTable('companyIncorporations');
        } catch (err) {
            // Table does not exist yet — nothing to migrate
            return;
        }

        if (!table.nominee) {
            await queryInterface.addColumn('companyIncorporations', 'nominee', {
                type: Sequelize.JSON,
                allowNull: true,
                defaultValue: null,
            });
        }
    },

    async down(queryInterface) {
        let table;
        try {
            table = await queryInterface.describeTable('companyIncorporations');
        } catch (err) {
            // Table does not exist — nothing to roll back
            return;
        }

        if (table.nominee) {
            await queryInterface.removeColumn('companyIncorporations', 'nominee');
        }
    },
};
