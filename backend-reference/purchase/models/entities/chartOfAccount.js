'use strict';
const Sequelize = require('sequelize');
const sequelizeConfig = require("../../configs/database/index");
const CoaRules = require('./coaRules');

const ChartOfAccount = sequelizeConfig.define("chartOfAccount", {
  id: {
    type: Sequelize.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  provider_account_id: {
    type: Sequelize.STRING,
    allowNull: true,
    unique: true,
  },
  account_name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  account_code: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  account_type: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  parent_account_id: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  description: {
    type: Sequelize.TEXT,
    allowNull: true,
  },
  syncStatus: {
    type: Sequelize.ENUM(
      "CREATE_PENDING",
      "CREATE_FAILED",
      "CREATE_SUCCESS",
      "UPDATE_PENDING",
      "UPDATE_FAILED",
      "UPDATE_SUCCESS"
    ),
    allowNull: false,
    defaultValue: "CREATE_SUCCESS",
  },
  createdBy: {
    type: Sequelize.ENUM('manual', 'system'),
    allowNull: false,
    defaultValue: 'manual',
  },
  vendorId: {
    type: Sequelize.BIGINT,
    allowNull: true,
  },
  partnerId: {
    type: Sequelize.BIGINT,
    allowNull: true,
  },
  corporateUserId: {
    type: Sequelize.BIGINT,
    allowNull: true,
  },
}, {
  timestamps: true
});

ChartOfAccount.belongsTo(CoaRules);

module.exports = ChartOfAccount;
