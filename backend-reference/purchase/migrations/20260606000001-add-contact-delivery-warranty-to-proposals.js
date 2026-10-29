'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('proposals')) return;

    const tableDesc = await queryInterface.describeTable('proposals');

    if (!tableDesc.contactPerson) {
      await queryInterface.addColumn('proposals', 'contactPerson', {
        type: Sequelize.STRING(255),
        allowNull: true,
        after: 'paymentTerms',
      });
    }
    if (!tableDesc.contactEmail) {
      await queryInterface.addColumn('proposals', 'contactEmail', {
        type: Sequelize.STRING(255),
        allowNull: true,
        after: 'contactPerson',
      });
    }
    if (!tableDesc.contactMobile) {
      await queryInterface.addColumn('proposals', 'contactMobile', {
        type: Sequelize.STRING(50),
        allowNull: true,
        after: 'contactEmail',
      });
    }
    if (!tableDesc.deliveryTimeline) {
      await queryInterface.addColumn('proposals', 'deliveryTimeline', {
        type: Sequelize.STRING(255),
        allowNull: true,
        after: 'contactMobile',
      });
    }
    if (!tableDesc.warranty) {
      await queryInterface.addColumn('proposals', 'warranty', {
        type: Sequelize.TEXT,
        allowNull: true,
        after: 'deliveryTimeline',
      });
    }
  },

  async down(queryInterface) {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('proposals')) return;

    const tableDesc = await queryInterface.describeTable('proposals');

    for (const col of ['warranty', 'deliveryTimeline', 'contactMobile', 'contactEmail', 'contactPerson']) {
      if (tableDesc[col]) {
        await queryInterface.removeColumn('proposals', col);
      }
    }
  },
};
