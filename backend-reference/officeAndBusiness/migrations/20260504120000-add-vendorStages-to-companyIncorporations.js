'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        const table = await queryInterface.describeTable('companyIncorporations');

        if (!table.vendorStages) {
            await queryInterface.addColumn('companyIncorporations', 'vendorStages', {
                type: Sequelize.JSON,
                allowNull: true,
                defaultValue: null,
            });
        }
    },

    async down(queryInterface) {
        const table = await queryInterface.describeTable('companyIncorporations');
        if (table.vendorStages) {
            await queryInterface.removeColumn('companyIncorporations', 'vendorStages');
        }
    },
};
