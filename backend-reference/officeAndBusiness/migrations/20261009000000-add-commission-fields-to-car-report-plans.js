'use strict';

const TABLE = 'carReportPlans';

// isCommissionConfigured is included here so the Accounting Portal needs no second migration for this table.
const columnDefinitions = (Sequelize) => ({
    commissionMode: {
        type: Sequelize.ENUM('MARGIN', 'AGENT_MARKUP', 'PRINCIPAL_MARKUP'),
        defaultValue: 'MARGIN',
        allowNull: true,
    },
    commissionType: {
        type: Sequelize.ENUM('PERCENTAGE', 'FLAT'),
        defaultValue: 'PERCENTAGE',
        allowNull: true,
    },
    commission: {
        type: Sequelize.DECIMAL(10, 4),
        defaultValue: 0.0,
        allowNull: true,
    },
    fixedCommissionPerTransaction: {
        type: Sequelize.DECIMAL(10, 4),
        defaultValue: 0.0,
        allowNull: true,
    },
    isCommissionInclGST: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: true,
    },
    isCommissionConfigured: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    },
});

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        let table;
        try {
            table = await queryInterface.describeTable(TABLE);
        } catch (err) {
            return;
        }
        const definitions = columnDefinitions(Sequelize);
        for (const [column, definition] of Object.entries(definitions)) {
            if (!table[column]) {
                await queryInterface.addColumn(TABLE, column, definition);
            }
        }
    },

    async down(queryInterface) {
        let table;
        try {
            table = await queryInterface.describeTable(TABLE);
        } catch (err) {
            return;
        }
        const columns = [
            'commissionMode',
            'commissionType',
            'commission',
            'fixedCommissionPerTransaction',
            'isCommissionInclGST',
            'isCommissionConfigured',
        ];
        for (const column of columns) {
            if (table[column]) {
                await queryInterface.removeColumn(TABLE, column);
            }
        }
    },
};
