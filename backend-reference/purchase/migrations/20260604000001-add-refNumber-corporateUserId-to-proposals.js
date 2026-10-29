'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('proposals')) return;

    const tableDesc = await queryInterface.describeTable('proposals');

    if (!tableDesc.corporateUserId) {
      await queryInterface.addColumn('proposals', 'corporateUserId', {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        after: 'rfqId',
      });
    }
    if (!tableDesc.refNumber) {
      await queryInterface.addColumn('proposals', 'refNumber', {
        type: Sequelize.STRING(30),
        allowNull: true,
        after: 'corporateUserId',
      });
    }
  },

  async down(queryInterface) {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('proposals')) return;

    const tableDesc = await queryInterface.describeTable('proposals');

    if (tableDesc.refNumber) {
      await queryInterface.removeColumn('proposals', 'refNumber');
    }
    if (tableDesc.corporateUserId) {
      await queryInterface.removeColumn('proposals', 'corporateUserId');
    }
  },
};
