'use strict';
const Sequelize = require('sequelize');
const sequelizeConfig = require('../../configs/database/index');

const ProcureVendor = sequelizeConfig.define(
  'procureVendor',
  {
    id: {
      type: Sequelize.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    tradeLicenseNo:{
      type: Sequelize.STRING(50),
      allowNull: true,
    },
    corporateUserId: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
    },
    businessName: {
      type: Sequelize.STRING(255),
      allowNull: false,
    },
    gstin: {
      type: Sequelize.STRING(20),
      allowNull: true,
    },
    contactPerson: {
      type: Sequelize.STRING(255),
      allowNull: false,
    },
    email: {
      type: Sequelize.STRING(255),
      allowNull: false,
    },
    phone: {
      type: Sequelize.STRING(20),
      allowNull: true,
    },
    tags: {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: [],
    },
    paymentTerms: {
      type: Sequelize.STRING(50),
      allowNull: true,
    },
    status: {
      type: Sequelize.ENUM('Active', 'Inactive'),
      allowNull: false,
      defaultValue: 'Active',
    },
    // Banking Information
    bankName: {
      type: Sequelize.STRING(255),
      allowNull: true,
    },
    accountNumber: {
      type: Sequelize.STRING(100),
      allowNull: true,
    },
    ifscCode: {
      type: Sequelize.STRING(50),
      allowNull: true,
    },
    payoutBeneficiaryId: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
    },
    notes: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'procure_vendors',
    paranoid: true,
    underscored: false,
  }
);

module.exports = ProcureVendor;
