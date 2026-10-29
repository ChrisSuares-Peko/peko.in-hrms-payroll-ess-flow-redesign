'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        let table;
        try {
            table = await queryInterface.describeTable('domainHostingPlans');
        } catch (err) {
            return;
        }
        if (!table.commissionMode) {
            await queryInterface.addColumn('domainHostingPlans', 'commissionMode', {
                type: Sequelize.ENUM('MARGIN', 'AGENT_MARKUP', 'PRINCIPAL_MARKUP'),
                defaultValue: 'MARGIN',
                allowNull: false,
            });
        }
        if (!table.commissionType) {
            await queryInterface.addColumn('domainHostingPlans', 'commissionType', {
                type: Sequelize.STRING,
                defaultValue: 'PERCENTAGE',
                allowNull: false,
            });
        }
        if (!table.commission) {
            await queryInterface.addColumn('domainHostingPlans', 'commission', {
                type: Sequelize.DECIMAL(10, 4),
                defaultValue: 0.0,
                allowNull: true,
            });
        }
        if (!table.fixedCommissionPerTransaction) {
            await queryInterface.addColumn('domainHostingPlans', 'fixedCommissionPerTransaction', {
                type: Sequelize.DECIMAL(10, 4),
                defaultValue: 0.0,
                allowNull: true,
            });
        }
        if (!table.isCommissionInclGST) {
            await queryInterface.addColumn('domainHostingPlans', 'isCommissionInclGST', {
                type: Sequelize.BOOLEAN,
                defaultValue: true,
                allowNull: true,
            });
        }
    },

    async down(queryInterface) {
        let table;
        try {
            table = await queryInterface.describeTable('domainHostingPlans');
        } catch (err) {
            return;
        }
        const columns = [
            'commissionMode',
            'commissionType',
            'commission',
            'fixedCommissionPerTransaction',
            'isCommissionInclGST',
        ];
        for (const column of columns) {
            if (table[column]) {
                await queryInterface.removeColumn('domainHostingPlans', column);
            }
        }
    },
};
