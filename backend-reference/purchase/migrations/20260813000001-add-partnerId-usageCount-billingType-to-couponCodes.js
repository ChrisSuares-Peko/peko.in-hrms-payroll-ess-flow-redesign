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

    if (!tableDesc.partnerId) {
      await queryInterface.addColumn('couponCodes', 'partnerId', {
        type: Sequelize.STRING,
        allowNull: true,
        after: 'status',
      });
    }

    if (!tableDesc.usageCount) {
      await queryInterface.addColumn('couponCodes', 'usageCount', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        after: 'partnerId',
      });
    }

    if (!tableDesc.billingType) {
      await queryInterface.addColumn('couponCodes', 'billingType', {
        type: Sequelize.ENUM('MONTHLY', 'ANNUALLY'),
        allowNull: false,
        // Model has no default, but existing rows need a value to satisfy NOT NULL — defaulting here only.
        defaultValue: 'MONTHLY',
        after: 'usageCount',
      });
    }

    if (!tableDesc.referralCodeId && hasTable(tables, 'referral_codes')) {
      await queryInterface.addColumn('couponCodes', 'referralCodeId', {
        type: Sequelize.BIGINT,
        allowNull: true,
        defaultValue: null,
        after: 'billingType',
        references: {
          model: 'referral_codes',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }
  },

  async down(queryInterface) {
    const tables = await queryInterface.showAllTables();
    if (!hasTable(tables, 'couponCodes')) return;

    const tableDesc = await queryInterface.describeTable('couponCodes');

    if (tableDesc.referralCodeId) {
      await queryInterface.removeColumn('couponCodes', 'referralCodeId');
    }
    if (tableDesc.billingType) {
      await queryInterface.removeColumn('couponCodes', 'billingType');
    }
    if (tableDesc.usageCount) {
      await queryInterface.removeColumn('couponCodes', 'usageCount');
    }
    if (tableDesc.partnerId) {
      await queryInterface.removeColumn('couponCodes', 'partnerId');
    }
  },
};
