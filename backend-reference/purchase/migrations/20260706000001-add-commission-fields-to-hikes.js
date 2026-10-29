'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const columns = await queryInterface.describeTable('hikes');

        if (!columns.commissionType) {
            await queryInterface.addColumn('hikes', 'commissionType', {
                type: Sequelize.ENUM('PERCENTAGE', 'FLAT'),
                defaultValue: 'PERCENTAGE',
                allowNull: true,
            });
        }
        if (!columns.commission) {
            await queryInterface.addColumn('hikes', 'commission', {
                type: Sequelize.DECIMAL(10, 4),
                defaultValue: 0.0,
                allowNull: true,
            });
        }
        if (!columns.fixedCommissionPerTransaction) {
            await queryInterface.addColumn('hikes', 'fixedCommissionPerTransaction', {
                type: Sequelize.DECIMAL(10, 4),
                defaultValue: 0.0,
                allowNull: true,
            });
        }
        if (!columns.isCommissionInclGST) {
            await queryInterface.addColumn('hikes', 'isCommissionInclGST', {
                type: Sequelize.BOOLEAN,
                defaultValue: true,
                allowNull: true,
            });
        }
    },
    down: async (queryInterface) => {
        const columns = await queryInterface.describeTable('hikes');

        if (columns.isCommissionInclGST) await queryInterface.removeColumn('hikes', 'isCommissionInclGST');
        if (columns.fixedCommissionPerTransaction) await queryInterface.removeColumn('hikes', 'fixedCommissionPerTransaction');
        if (columns.commission) await queryInterface.removeColumn('hikes', 'commission');
        if (columns.commissionType) await queryInterface.removeColumn('hikes', 'commissionType');
    },
};
