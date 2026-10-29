'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    const tableExists = tables.some(t => t.toLowerCase() === 'tax_gstr1_hsn_manuals');
    if (!tableExists) return;

    const [columns] = await queryInterface.sequelize.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tax_gstr1_hsn_manuals'`
    );
    const colNames = columns.map(c => c.COLUMN_NAME);

    if (!colNames.includes('source')) {
      await queryInterface.addColumn('tax_gstr1_hsn_manuals', 'source', {
        type: Sequelize.ENUM('invoice', 'manual'),
        allowNull: false,
        defaultValue: 'manual',
        after: 'totalTax',
      });
    }

    if (!colNames.includes('deletedAt')) {
      await queryInterface.addColumn('tax_gstr1_hsn_manuals', 'deletedAt', {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
        after: 'source',
      });
    }
  },

  async down(queryInterface) {
    const tables = await queryInterface.showAllTables();
    const tableExists = tables.some(t => t.toLowerCase() === 'tax_gstr1_hsn_manuals');
    if (!tableExists) return;

    const [columns] = await queryInterface.sequelize.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tax_gstr1_hsn_manuals'`
    );
    const colNames = columns.map(c => c.COLUMN_NAME);

    if (colNames.includes('deletedAt')) {
      await queryInterface.removeColumn('tax_gstr1_hsn_manuals', 'deletedAt');
    }

    if (colNames.includes('source')) {
      await queryInterface.removeColumn('tax_gstr1_hsn_manuals', 'source');
    }
  },
};
