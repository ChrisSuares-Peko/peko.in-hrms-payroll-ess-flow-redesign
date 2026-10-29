'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('serviceOperators', 'recordJournalEntry', {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('serviceOperators', 'recordJournalEntry');
  },
};
