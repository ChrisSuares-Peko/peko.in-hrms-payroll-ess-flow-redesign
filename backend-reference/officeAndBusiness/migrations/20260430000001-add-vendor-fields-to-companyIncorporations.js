'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        const table = await queryInterface.describeTable('companyIncorporations');
        if (!table.vendorStatus) {
            await queryInterface.addColumn('companyIncorporations', 'vendorStatus', {
                type: Sequelize.ENUM('NOT_SENT', 'SENDING', 'SENT', 'FAILED'),
                defaultValue: 'NOT_SENT',
                allowNull: false,
            });
        }
        if (!table.vendorSentAt) {
            await queryInterface.addColumn('companyIncorporations', 'vendorSentAt', {
                type: Sequelize.DATE,
                allowNull: true,
            });
        }
        if (!table.vendorAttempts) {
            await queryInterface.addColumn('companyIncorporations', 'vendorAttempts', {
                type: Sequelize.INTEGER,
                defaultValue: 0,
                allowNull: false,
            });
        }
        if (!table.vendorError) {
            await queryInterface.addColumn('companyIncorporations', 'vendorError', {
                type: Sequelize.TEXT,
                allowNull: true,
            });
        }
    },

    async down(queryInterface) {
        const table = await queryInterface.describeTable('companyIncorporations');
        if (table.vendorError) await queryInterface.removeColumn('companyIncorporations', 'vendorError');
        if (table.vendorAttempts) await queryInterface.removeColumn('companyIncorporations', 'vendorAttempts');
        if (table.vendorSentAt) await queryInterface.removeColumn('companyIncorporations', 'vendorSentAt');
        if (table.vendorStatus) await queryInterface.removeColumn('companyIncorporations', 'vendorStatus');
    },
};
