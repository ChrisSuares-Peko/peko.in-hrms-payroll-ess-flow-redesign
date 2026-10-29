'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        const table = await queryInterface.describeTable('companyIncorporations');

        if (!table.additionalShareholders) {
            await queryInterface.addColumn('companyIncorporations', 'additionalShareholders', {
                type: Sequelize.JSON,
                allowNull: true,
                defaultValue: [],
            });
        }
        if (!table.llpNicCodes) {
            await queryInterface.addColumn('companyIncorporations', 'llpNicCodes', {
                type: Sequelize.STRING,
                allowNull: true,
            });
        }
        if (!table.llpTotalCapital) {
            await queryInterface.addColumn('companyIncorporations', 'llpTotalCapital', {
                type: Sequelize.STRING,
                allowNull: true,
            });
        }
    },

    async down(queryInterface) {
        const table = await queryInterface.describeTable('companyIncorporations');
        if (table.llpTotalCapital) await queryInterface.removeColumn('companyIncorporations', 'llpTotalCapital');
        if (table.llpNicCodes) await queryInterface.removeColumn('companyIncorporations', 'llpNicCodes');
        if (table.additionalShareholders) await queryInterface.removeColumn('companyIncorporations', 'additionalShareholders');
    },
};
