'use strict';

// Some MySQL setups (e.g. Windows with lower_case_table_names=1) fold table
// names to lowercase in SHOW TABLES, so compare case-insensitively.
const hasTable = (tables, name) =>
  tables.some((t) => t.toLowerCase() === name.toLowerCase());

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (!hasTable(tables, 'couponCodes')) return;

    const tableDesc = await queryInterface.describeTable('couponCodes');

    if (!tableDesc.packageId && hasTable(tables, 'packages')) {
      await queryInterface.addColumn('couponCodes', 'packageId', {
        type: Sequelize.BIGINT,
        allowNull: true,
        after: 'billingType',
        references: {
          model: 'packages',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }

    if (!tableDesc.serviceOperatorId && hasTable(tables, 'serviceOperators')) {
      await queryInterface.addColumn('couponCodes', 'serviceOperatorId', {
        type: Sequelize.BIGINT,
        allowNull: true,
        after: 'packageId',
        references: {
          model: 'serviceOperators',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }

    if (!tableDesc.couponType) {
      await queryInterface.addColumn('couponCodes', 'couponType', {
        type: Sequelize.ENUM('SUBSCRIPTION', 'SERVICES'),
        allowNull: false,
        // Model has no default, but existing rows need a value to satisfy NOT NULL — defaulting here only.
        defaultValue: 'SUBSCRIPTION',
        after: 'serviceOperatorId',
      });
    }

    if (!tableDesc.minimumPurchase) {
      await queryInterface.addColumn('couponCodes', 'minimumPurchase', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
        after: 'couponType',
      });
    }

    if (!tableDesc.maximumDiscount) {
      await queryInterface.addColumn('couponCodes', 'maximumDiscount', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        after: 'minimumPurchase',
      });
    }

    if (tableDesc.billingType && tableDesc.billingType.allowNull === false) {
      await queryInterface.changeColumn('couponCodes', 'billingType', {
        type: Sequelize.ENUM('MONTHLY', 'ANNUALLY'),
        allowNull: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (!hasTable(tables, 'couponCodes')) return;

    const tableDesc = await queryInterface.describeTable('couponCodes');

    if (tableDesc.billingType && tableDesc.billingType.allowNull === true) {
      await queryInterface.changeColumn('couponCodes', 'billingType', {
        type: Sequelize.ENUM('MONTHLY', 'ANNUALLY'),
        allowNull: false,
        defaultValue: 'MONTHLY',
      });
    }

    if (tableDesc.maximumDiscount) {
      await queryInterface.removeColumn('couponCodes', 'maximumDiscount');
    }
    if (tableDesc.minimumPurchase) {
      await queryInterface.removeColumn('couponCodes', 'minimumPurchase');
    }
    if (tableDesc.couponType) {
      await queryInterface.removeColumn('couponCodes', 'couponType');
    }
    if (tableDesc.serviceOperatorId) {
      await queryInterface.removeColumn('couponCodes', 'serviceOperatorId');
    }
    if (tableDesc.packageId) {
      await queryInterface.removeColumn('couponCodes', 'packageId');
    }
  },
};
