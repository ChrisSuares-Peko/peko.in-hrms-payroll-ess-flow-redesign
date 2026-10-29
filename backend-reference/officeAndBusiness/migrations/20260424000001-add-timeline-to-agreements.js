'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('agreements').catch(() => null);
    if (!tableDesc) return;
    if (tableDesc.timeline) return; // already exists, skip
    await queryInterface.addColumn('agreements', 'timeline', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: []
    });
  },

  async down(queryInterface) {
    const tableDesc = await queryInterface.describeTable('agreements').catch(() => null);
    if (!tableDesc || !tableDesc.timeline) return;
    await queryInterface.removeColumn('agreements', 'timeline');
  }
};
