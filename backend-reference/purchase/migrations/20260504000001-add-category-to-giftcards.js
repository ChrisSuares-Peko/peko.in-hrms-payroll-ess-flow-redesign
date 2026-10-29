'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableExists = await queryInterface.showAllTables().then(tables => tables.includes('giftCards'));
    if (!tableExists) return;

    const tableDescription = await queryInterface.describeTable('giftCards');
    if (tableDescription.category) return;

    await queryInterface.addColumn('giftCards', 'category', {
      type: Sequelize.STRING,
      defaultValue: null,
      allowNull: true,
    });
  },

  down: async (queryInterface) => {
    const tableExists = await queryInterface.showAllTables().then(tables => tables.includes('giftCards'));
    if (!tableExists) return;

    const tableDescription = await queryInterface.describeTable('giftCards');
    if (!tableDescription.category) return;

    await queryInterface.removeColumn('giftCards', 'category');
  }
};
