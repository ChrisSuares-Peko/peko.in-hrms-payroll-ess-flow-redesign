'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        const table = await queryInterface.describeTable('companyIncorporations');

        if (!table.vendorDocuments) {
            await queryInterface.addColumn('companyIncorporations', 'vendorDocuments', {
                type: Sequelize.JSON,
                allowNull: true,
                defaultValue: null,
            });
        }
    },

    async down(queryInterface) {
        const table = await queryInterface.describeTable('companyIncorporations');
        if (table.vendorDocuments) {
            await queryInterface.removeColumn('companyIncorporations', 'vendorDocuments');
        }
    },
};
