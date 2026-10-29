'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDefinition = await queryInterface.describeTable('giftCards');

    if (!tableDefinition.image) {
      await queryInterface.addColumn('giftCards', 'image', {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: null,
      });
    }

    if (!tableDefinition.description) {
      await queryInterface.addColumn('giftCards', 'description', {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: null,
      });
    }

    if (!tableDefinition.priceType) {
      await queryInterface.addColumn('giftCards', 'priceType', {
        type: Sequelize.ENUM('FIXED', 'FLEXI'),
        allowNull: true,
        defaultValue: null,
      });
    }

    if (!tableDefinition.sold_quantity) {
      await queryInterface.addColumn('giftCards', 'sold_quantity', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      });
    }
  },

  async down(queryInterface) {
    const tableDefinition = await queryInterface.describeTable('giftCards');

    if (tableDefinition.sold_quantity) {
      await queryInterface.removeColumn('giftCards', 'sold_quantity');
    }

    if (tableDefinition.priceType) {
      await queryInterface.removeColumn('giftCards', 'priceType');
      await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_giftCards_priceType\";");
    }

    if (tableDefinition.description) {
      await queryInterface.removeColumn('giftCards', 'description');
    }

    if (tableDefinition.image) {
      await queryInterface.removeColumn('giftCards', 'image');
    }
  }
};
