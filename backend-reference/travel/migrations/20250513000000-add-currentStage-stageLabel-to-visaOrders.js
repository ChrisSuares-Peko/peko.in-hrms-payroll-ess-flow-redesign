'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        const tableDesc = await queryInterface.describeTable('visaOrders');
        if (!tableDesc.currentStage) {
            await queryInterface.addColumn('visaOrders', 'currentStage', {
                type: Sequelize.INTEGER,
                allowNull: true,
            });
        }
        if (!tableDesc.stageLabel) {
            await queryInterface.addColumn('visaOrders', 'stageLabel', {
                type: Sequelize.STRING,
                allowNull: true,
            });
        }
    },
    async down(queryInterface) {
        const tableDesc = await queryInterface.describeTable('visaOrders');
        if (tableDesc.currentStage) {
            await queryInterface.removeColumn('visaOrders', 'currentStage');
        }
        if (tableDesc.stageLabel) {
            await queryInterface.removeColumn('visaOrders', 'stageLabel');
        }
    },
};
