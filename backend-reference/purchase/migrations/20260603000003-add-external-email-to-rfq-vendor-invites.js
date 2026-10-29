'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const [inviteTables] = await queryInterface.sequelize.query(`SHOW TABLES LIKE 'rfq_vendor_invites'`);
    if (inviteTables.length) {
      await queryInterface.addColumn('rfq_vendor_invites', 'externalEmail', {
        type: Sequelize.STRING(255),
        allowNull: true,
        after: 'rfqId',
      });
      await queryInterface.changeColumn('rfq_vendor_invites', 'vendorId', {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
      });
    }

    const [proposalTables] = await queryInterface.sequelize.query(`SHOW TABLES LIKE 'proposals'`);
    if (proposalTables.length) {
      await queryInterface.addColumn('proposals', 'externalEmail', {
        type: Sequelize.STRING(255),
        allowNull: true,
        after: 'rfqId',
      });
      await queryInterface.changeColumn('proposals', 'vendorId', {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const [inviteTables] = await queryInterface.sequelize.query(`SHOW TABLES LIKE 'rfq_vendor_invites'`);
    if (inviteTables.length) {
      await queryInterface.removeColumn('rfq_vendor_invites', 'externalEmail');
      await queryInterface.changeColumn('rfq_vendor_invites', 'vendorId', {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
      });
    }

    const [proposalTables] = await queryInterface.sequelize.query(`SHOW TABLES LIKE 'proposals'`);
    if (proposalTables.length) {
      await queryInterface.removeColumn('proposals', 'externalEmail');
      await queryInterface.changeColumn('proposals', 'vendorId', {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
      });
    }
  },
};
