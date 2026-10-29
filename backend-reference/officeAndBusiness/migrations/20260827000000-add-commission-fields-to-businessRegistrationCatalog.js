'use strict';

// Adds plan-level commission fields to the Business Registration catalog, matching
// the pattern used by eSIM Plans / Gift Cards / Work Plans / Service Packages etc.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const columns = await queryInterface.describeTable('businessRegistrationCatalogs');

    if (!columns.commissionMode) {
      await queryInterface.addColumn('businessRegistrationCatalogs', 'commissionMode', {
        type: Sequelize.ENUM('MARGIN', 'AGENT_MARKUP', 'PRINCIPAL_MARKUP'),
        defaultValue: 'MARGIN',
        allowNull: true,
      });
    }
    if (!columns.commissionType) {
      await queryInterface.addColumn('businessRegistrationCatalogs', 'commissionType', {
        type: Sequelize.ENUM('PERCENTAGE', 'FLAT'),
        defaultValue: 'PERCENTAGE',
        allowNull: true,
      });
    }
    if (!columns.commission) {
      await queryInterface.addColumn('businessRegistrationCatalogs', 'commission', {
        type: Sequelize.DECIMAL(10, 4),
        defaultValue: 0,
        allowNull: true,
      });
    }
    if (!columns.fixedCommissionPerTransaction) {
      await queryInterface.addColumn('businessRegistrationCatalogs', 'fixedCommissionPerTransaction', {
        type: Sequelize.DECIMAL(10, 4),
        defaultValue: 0,
        allowNull: true,
      });
    }
    if (!columns.isCommissionInclGST) {
      await queryInterface.addColumn('businessRegistrationCatalogs', 'isCommissionInclGST', {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: true,
      });
    }
  },

  down: async (queryInterface) => {
    const columns = await queryInterface.describeTable('businessRegistrationCatalogs');

    if (columns.commissionMode) await queryInterface.removeColumn('businessRegistrationCatalogs', 'commissionMode');
    if (columns.commissionType) await queryInterface.removeColumn('businessRegistrationCatalogs', 'commissionType');
    if (columns.commission) await queryInterface.removeColumn('businessRegistrationCatalogs', 'commission');
    if (columns.fixedCommissionPerTransaction) await queryInterface.removeColumn('businessRegistrationCatalogs', 'fixedCommissionPerTransaction');
    if (columns.isCommissionInclGST) await queryInterface.removeColumn('businessRegistrationCatalogs', 'isCommissionInclGST');
  },
};
