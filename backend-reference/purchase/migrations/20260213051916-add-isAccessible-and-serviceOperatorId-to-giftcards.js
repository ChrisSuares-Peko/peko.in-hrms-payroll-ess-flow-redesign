'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {

    const tableDefinition = await queryInterface.describeTable('giftCards');

    if (!tableDefinition.isAccessible) {
      await queryInterface.addColumn('giftCards', 'isAccessible', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      });
    }

    if (!tableDefinition.serviceOperatorId) {

      await queryInterface.addColumn('giftCards', 'serviceOperatorId', {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
          model: 'serviceOperators',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      });

    
      await queryInterface.sequelize.query(`
        UPDATE giftCards
        SET serviceOperatorId = 82
        WHERE serviceOperatorId IS NULL;
      `);

    
      await queryInterface.changeColumn('giftCards', 'serviceOperatorId', {
        type: Sequelize.BIGINT,
        allowNull: false,
      });
    }
  },

  async down(queryInterface) {

    const tableDefinition = await queryInterface.describeTable('giftCards');

    if (tableDefinition.serviceOperatorId) {
      await queryInterface.removeColumn('giftCards', 'serviceOperatorId');
    }

    if (tableDefinition.isAccessible) {
      await queryInterface.removeColumn('giftCards', 'isAccessible');
    }
  }
};
