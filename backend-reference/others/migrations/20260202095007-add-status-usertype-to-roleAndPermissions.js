'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('roleAndPermissions');

    if (!tableDescription.status) {
      await queryInterface.addColumn('roleAndPermissions', 'status', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      });
    }

    if (!tableDescription.userType) {
      await queryInterface.addColumn('roleAndPermissions', 'userType', {
        type: Sequelize.ENUM('SYSTEMUSER', 'PARTNER'),
        allowNull: false,
        defaultValue: 'SYSTEMUSER',
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('roleAndPermissions', 'status');
    await queryInterface.removeColumn('roleAndPermissions', 'userType');

    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_roleAndPermissions_userType";'
    );
  },
};