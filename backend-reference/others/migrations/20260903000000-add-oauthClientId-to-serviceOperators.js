'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('serviceOperators');
    if (!tableDesc.oauthClientId) {
      await queryInterface.addColumn('serviceOperators', 'oauthClientId', {
        type: Sequelize.INTEGER,
        references: {
          model: 'oauth_clients', // name of Target table
          key: 'id', // key in Target model
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }
  },

  async down(queryInterface) {
    const tableDesc = await queryInterface.describeTable('serviceOperators');
    if (tableDesc.oauthClientId) {
      await queryInterface.removeColumn('serviceOperators', 'oauthClientId');
    }
  },
};
