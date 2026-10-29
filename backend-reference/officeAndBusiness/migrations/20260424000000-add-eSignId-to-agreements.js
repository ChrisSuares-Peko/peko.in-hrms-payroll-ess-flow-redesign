'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('agreements').catch(() => null);
    if (!tableDesc) return;
    if (tableDesc.eSignId) return; // already exists, skip
    await queryInterface.addColumn('agreements', 'eSignId', {
      type: Sequelize.BIGINT,
      allowNull: true,
      defaultValue: null
    });
  },

  async down(queryInterface) {
    const tableDesc = await queryInterface.describeTable('agreements').catch(() => null);
    if (!tableDesc || !tableDesc.eSignId) return;
    await queryInterface.removeColumn('agreements', 'eSignId');
  }
};
