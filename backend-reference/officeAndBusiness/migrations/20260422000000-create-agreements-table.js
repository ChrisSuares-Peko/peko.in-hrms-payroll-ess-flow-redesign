'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('agreements', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      corporateUserId: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      subCorporateUserId: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      customerId: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      quotationId: {
        type: Sequelize.BIGINT,
        allowNull: true,
        defaultValue: null,
      },
      agreementNumber: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      prefix: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      contractType: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      currency: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      paymentTerms: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      billingFrequency: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      contractValue: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
        defaultValue: 0.00,
      },
      startDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      endDate: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        defaultValue: null,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      specialTerms: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      documentUrl: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      },
      eSignId: {
        type: Sequelize.BIGINT,
        allowNull: true,
        defaultValue: null,
      },
      timeline: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: [],
      },
      status: {
        type: Sequelize.ENUM('DRAFT', 'PENDING', 'SENT', 'SIGNED', 'ACTIVE', 'EXPIRING_SOON'),
        allowNull: false,
        defaultValue: 'DRAFT',
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
  },

  async down(queryInterface) {
    await queryInterface.dropTable('agreements');
  }
};
