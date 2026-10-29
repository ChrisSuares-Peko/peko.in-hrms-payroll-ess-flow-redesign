'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('privacy_policy_details', 'effectiveFrom', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: Sequelize.NOW,
    });

    await queryInterface.sequelize.query(
      `UPDATE privacy_policy_details SET effectiveFrom = NULL WHERE isMandatory = false`
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `UPDATE privacy_policy_details SET effectiveFrom = NOW() WHERE effectiveFrom IS NULL`
    );

    await queryInterface.changeColumn('privacy_policy_details', 'effectiveFrom', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    });
  },
};
