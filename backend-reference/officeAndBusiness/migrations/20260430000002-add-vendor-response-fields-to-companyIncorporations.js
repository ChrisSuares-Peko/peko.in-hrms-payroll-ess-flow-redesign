'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        const table = await queryInterface.describeTable('companyIncorporations');
        if (!table.vendorApplicationId) {
            await queryInterface.addColumn('companyIncorporations', 'vendorApplicationId', {
                type: Sequelize.STRING,
                allowNull: true,
            });
        }
        if (!table.vendorTrackingId) {
            await queryInterface.addColumn('companyIncorporations', 'vendorTrackingId', {
                type: Sequelize.STRING,
                allowNull: true,
            });
        }
    },

    async down(queryInterface) {
        const table = await queryInterface.describeTable('companyIncorporations');
        if (table.vendorTrackingId) await queryInterface.removeColumn('companyIncorporations', 'vendorTrackingId');
        if (table.vendorApplicationId) await queryInterface.removeColumn('companyIncorporations', 'vendorApplicationId');
    },
};
