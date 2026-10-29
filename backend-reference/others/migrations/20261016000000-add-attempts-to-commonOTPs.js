'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('commonOTPs');
    if (!tableDesc.attempts) {
      await queryInterface.addColumn('commonOTPs', 'attempts', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      });
    }
  },

  async down(queryInterface) {
    const tableDesc = await queryInterface.describeTable('commonOTPs');
    if (tableDesc.attempts) {
      await queryInterface.removeColumn('commonOTPs', 'attempts');
    }
  },
};
