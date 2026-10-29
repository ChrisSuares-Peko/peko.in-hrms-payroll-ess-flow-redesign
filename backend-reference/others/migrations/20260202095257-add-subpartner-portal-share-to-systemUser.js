'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('systemUsers');

    if (!tableDescription.subPartnerId) {
      await queryInterface.addColumn('systemUsers', 'subPartnerId', {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      });
    }

    if (!tableDescription.portalUrl) {
      await queryInterface.addColumn('systemUsers', 'portalUrl', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    if (!tableDescription.sharePercentage) {
      await queryInterface.addColumn('systemUsers', 'sharePercentage', {
        type: Sequelize.DECIMAL(12, 4),
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('systemUsers', 'subPartnerId');
    await queryInterface.removeColumn('systemUsers', 'portalUrl');
    await queryInterface.removeColumn('systemUsers', 'sharePercentage');
  },
};