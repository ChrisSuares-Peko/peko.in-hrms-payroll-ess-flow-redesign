'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        const table = await queryInterface.describeTable('companyIncorporations');

        if (!table.vendorSetupId) {
            await queryInterface.addColumn('companyIncorporations', 'vendorSetupId', {
                type: Sequelize.STRING,
                allowNull: true,
                defaultValue: null,
            });
        }
    },

    async down(queryInterface) {
        const table = await queryInterface.describeTable('companyIncorporations');
        if (table.vendorSetupId) {
            await queryInterface.removeColumn('companyIncorporations', 'vendorSetupId');
        }
    },
};
