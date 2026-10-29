'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const columns = await queryInterface.describeTable('giftCards');

    if (!columns.commissionType) {
      await queryInterface.addColumn('giftCards', 'commissionType', {
        type: Sequelize.ENUM('PERCENTAGE', 'FLAT'),
        defaultValue: 'PERCENTAGE',
        allowNull: true,
      });
    }
    if (!columns.commission) {
      await queryInterface.addColumn('giftCards', 'commission', {
        type: Sequelize.DECIMAL(10, 4),
        defaultValue: 0,
        allowNull: true,
      });
    }
    if (!columns.fixedCommissionPerTransaction) {
      await queryInterface.addColumn('giftCards', 'fixedCommissionPerTransaction', {
        type: Sequelize.DECIMAL(10, 4),
        defaultValue: 0,
        allowNull: true,
      });
    }
    if (!columns.isCommissionInclGST) {
      await queryInterface.addColumn('giftCards', 'isCommissionInclGST', {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: true,
      });
    }
  },

  down: async (queryInterface) => {
    const columns = await queryInterface.describeTable('giftCards');

    if (columns.isCommissionInclGST) await queryInterface.removeColumn('giftCards', 'isCommissionInclGST');
    if (columns.fixedCommissionPerTransaction) await queryInterface.removeColumn('giftCards', 'fixedCommissionPerTransaction');
    if (columns.commission) await queryInterface.removeColumn('giftCards', 'commission');
    if (columns.commissionType) await queryInterface.removeColumn('giftCards', 'commissionType');
  },
};
