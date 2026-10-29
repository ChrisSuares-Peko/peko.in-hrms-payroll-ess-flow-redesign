'use strict';

module.exports = {
  async up(queryInterface) {
    const tableDescription = await queryInterface.describeTable('serviceOperators');

    if (tableDescription.marginType) {
      await queryInterface.removeColumn('serviceOperators', 'marginType');
    }
    if (tableDescription.margin) {
      await queryInterface.removeColumn('serviceOperators', 'margin');
    }
  },

  async down(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('serviceOperators');

    if (!tableDescription.marginType) {
      await queryInterface.addColumn('serviceOperators', 'marginType', {
        type: Sequelize.ENUM('FLAT', 'PERCENTAGE'),
        defaultValue: 'PERCENTAGE',
      });
    }
    if (!tableDescription.margin) {
      await queryInterface.addColumn('serviceOperators', 'margin', {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.0,
      });
    }
  },
};
