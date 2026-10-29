'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('invoicings', 'status', {
      type: Sequelize.ENUM(
        'PENDING', 'PAID', 'CANCELLED', 'OVERDUE',
        'REJECTED', 'APPROVED', 'ACCEPTED', 'COMPLETED', 'PARTIAL'
      ),
      defaultValue: 'PENDING',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('invoicings', 'status', {
      type: Sequelize.ENUM(
        'PENDING', 'PAID', 'CANCELLED', 'OVERDUE',
        'REJECTED', 'APPROVED', 'ACCEPTED', 'COMPLETED'
      ),
      defaultValue: 'PENDING',
    });
  },
};
