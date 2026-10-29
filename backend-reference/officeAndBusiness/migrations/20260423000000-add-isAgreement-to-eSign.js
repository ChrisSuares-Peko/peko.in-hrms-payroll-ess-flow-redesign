'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('eSigns', 'isAgreement', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    });
    await queryInterface.addColumn('eSigns', 'agreementId', {
      type: Sequelize.BIGINT,
      allowNull: true,
      defaultValue: null
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('eSigns', 'isAgreement');
    await queryInterface.removeColumn('eSigns', 'agreementId');
  }
};
