'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('agreements').catch(() => null);
    if (!tableDesc) return;

    const currentEnum = tableDesc.status?.special?.split("','") || [];
    const hasPending = currentEnum.some(v => v.includes('PENDING'));
    if (hasPending) return; // PENDING already exists, skip

    await queryInterface.changeColumn('agreements', 'status', {
      type: Sequelize.ENUM('DRAFT', 'PENDING', 'SENT', 'SIGNED', 'ACTIVE', 'EXPIRING_SOON'),
      allowNull: false,
      defaultValue: 'DRAFT'
    });
  },

  async down(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('agreements').catch(() => null);
    if (!tableDesc) return;
    await queryInterface.changeColumn('agreements', 'status', {
      type: Sequelize.ENUM('DRAFT', 'SENT', 'SIGNED', 'ACTIVE', 'EXPIRING_SOON'),
      allowNull: false,
      defaultValue: 'DRAFT'
    });
  }
};
