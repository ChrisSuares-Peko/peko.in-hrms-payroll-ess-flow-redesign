'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableExists = await queryInterface.tableExists('ctrlPayConnections');
    if (tableExists) return;

    await queryInterface.createTable('ctrlPayConnections', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      corporateId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        unique: true,
      },
      connectedBy: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      subject: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('CONNECTED', 'RECONNECT_REQUIRED', 'DISCONNECTED'),
        allowNull: false,
        defaultValue: 'CONNECTED',
      },
      idToken: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      idTokenExpiresAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      refreshToken: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      pan: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      mobile: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      partnerCodeTaggedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      walletLiveAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      dashboardEnteredAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('ctrlPayConnections', ['subject'], {
      name: 'ctrlPayConnections_subject',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('ctrlPayConnections');
  },
};
