'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('esimProfiles', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      userId: Sequelize.INTEGER,
      corporateUserId: Sequelize.INTEGER,
      customerUid: Sequelize.STRING,
      esimUid: Sequelize.STRING,
      iccid: {
        type: Sequelize.STRING,
        unique: true
      },
      activationCode: Sequelize.TEXT,
      corporateTxnId: Sequelize.BIGINT,
      planId: Sequelize.STRING,
      country: Sequelize.STRING,
      vendor: Sequelize.STRING,
      status: {
        type: Sequelize.ENUM('ACTIVE', 'EXPIRED', 'SUSPENDED'),
        defaultValue: 'ACTIVE'
      },
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('esimProfiles');
  }
};
