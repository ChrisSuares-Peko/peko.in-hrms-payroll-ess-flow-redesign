'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableExists = await queryInterface.showAllTables().then(tables => tables.includes('tax_ims_invoices'));
    if (!tableExists) return;

    const [rows] = await queryInterface.sequelize.query(
      `SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tax_ims_invoices' AND COLUMN_NAME = 'imsAction'`
    );
    if (!rows.length) return;

    const columnType = rows[0].COLUMN_TYPE;
    if (columnType.includes("'rejected'")) return;

    await queryInterface.changeColumn('tax_ims_invoices', 'imsAction', {
      type: Sequelize.ENUM('noaction', 'pending', 'accepted', 'rejected'),
      allowNull: false,
      defaultValue: 'noaction',
    });
  },

  async down(queryInterface, Sequelize) {
    const tableExists = await queryInterface.showAllTables().then(tables => tables.includes('tax_ims_invoices'));
    if (!tableExists) return;

    await queryInterface.changeColumn('tax_ims_invoices', 'imsAction', {
      type: Sequelize.ENUM('noaction', 'pending', 'accepted'),
      allowNull: false,
      defaultValue: 'noaction',
    });
  },
};
