'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        let table;
        try {
            table = await queryInterface.describeTable('companyIncorporations');
        } catch (err) {
            return;
        }
        if (!table.mcaFilingFee) {
            await queryInterface.addColumn('companyIncorporations', 'mcaFilingFee', {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0,
            });
        }
    },

    async down(queryInterface) {
        let table;
        try {
            table = await queryInterface.describeTable('companyIncorporations');
        } catch (err) {
            return;
        }
        if (table.mcaFilingFee) {
            await queryInterface.removeColumn('companyIncorporations', 'mcaFilingFee');
        }
    },
};
