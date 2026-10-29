'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('serviceOperators');

    if (!tableDesc.fixedCommissionPerTransaction) {
      await queryInterface.addColumn('serviceOperators', 'fixedCommissionPerTransaction', {
        type: Sequelize.DECIMAL(10, 4),
        defaultValue: 0.0,
        allowNull: true,
      });
    }

    if (!tableDesc.isCommissionInclGST) {
      await queryInterface.addColumn('serviceOperators', 'isCommissionInclGST', {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const tableDesc = await queryInterface.describeTable('serviceOperators');

    if (tableDesc.fixedCommissionPerTransaction) {
      await queryInterface.removeColumn('serviceOperators', 'fixedCommissionPerTransaction');
    }

    if (tableDesc.isCommissionInclGST) {
      await queryInterface.removeColumn('serviceOperators', 'isCommissionInclGST');
    }
  },
};
