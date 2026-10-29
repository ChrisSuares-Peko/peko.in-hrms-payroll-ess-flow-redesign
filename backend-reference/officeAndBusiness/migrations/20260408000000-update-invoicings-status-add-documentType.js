'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add documentType column
    await queryInterface.addColumn('invoicings', 'documentType', {
      type: Sequelize.ENUM('INVOICE', 'SALES_ORDER', 'QUOTATION'),
      allowNull: false,
      defaultValue: 'INVOICE',
    });

    // 2. Update status ENUM to include new values
    await queryInterface.changeColumn('invoicings', 'status', {
      type: Sequelize.ENUM('PENDING', 'PAID', 'CANCELLED', 'OVERDUE', 'REJECTED', 'APPROVED', 'ACCEPTED', 'COMPLETED'),
      defaultValue: 'PENDING',
    });
  },

  async down(queryInterface, Sequelize) {
    // 1. Remove documentType column
    await queryInterface.removeColumn('invoicings', 'documentType');

    // 2. Revert status ENUM to original values
    await queryInterface.changeColumn('invoicings', 'status', {
      type: Sequelize.ENUM('PENDING', 'PAID', 'CANCELLED', 'OVERDUE'),
      defaultValue: 'PENDING',
    });
  },
};
