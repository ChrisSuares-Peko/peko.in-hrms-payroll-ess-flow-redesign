'use strict';

const COLUMNS = (Sequelize) => ({
  taxableAmount: { type: Sequelize.DECIMAL(12, 4), allowNull: true, defaultValue: null },
  taxAmount: { type: Sequelize.DECIMAL(12, 4), allowNull: true, defaultValue: null },
  taxRate: { type: Sequelize.DECIMAL(6, 3), allowNull: true, defaultValue: null },
});

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('subscriptions');
    for (const [name, definition] of Object.entries(COLUMNS(Sequelize))) {
      if (!tableDescription[name]) {
        await queryInterface.addColumn('subscriptions', name, definition);
      }
    }
  },

  async down(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('subscriptions');
    for (const name of Object.keys(COLUMNS(Sequelize))) {
      if (tableDescription[name]) {
        await queryInterface.removeColumn('subscriptions', name);
      }
    }
  },
};
