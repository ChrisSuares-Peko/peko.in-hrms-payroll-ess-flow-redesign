'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        const table = await queryInterface.describeTable('companyIncorporations');

        if (!table.approvedCompanyName) {
            await queryInterface.addColumn('companyIncorporations', 'approvedCompanyName', {
                type: Sequelize.STRING,
                allowNull: true,
                defaultValue: null,
            });
        }
    },

    async down(queryInterface) {
        const table = await queryInterface.describeTable('companyIncorporations');
        if (table.approvedCompanyName) {
            await queryInterface.removeColumn('companyIncorporations', 'approvedCompanyName');
        }
    },
};
