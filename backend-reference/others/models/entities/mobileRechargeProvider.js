const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");

const mobileRechargeProviders = sequelizeConfig.define("mobileRechargeProviders", {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  providerName: {
    type: Sequelize.STRING,
    unique: true,
  },
  displayName: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  status: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
  },
  commissionMode: {
    type: Sequelize.ENUM('MARGIN', 'AGENT_MARKUP', 'PRINCIPAL_MARKUP'),
    defaultValue: 'MARGIN',
  },
  commission: {
    type: Sequelize.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  commissionType: {
    type: Sequelize.ENUM('PERCENTAGE', 'FLAT'),
    defaultValue: 'PERCENTAGE',
  },
  fixedCommissionPerTransaction: {
    type: Sequelize.DECIMAL(10, 4),
    defaultValue: 0.0,
    allowNull: true,
  },
  isCommissionInclGST: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
    allowNull: true,
  },
  isCommissionConfigured: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  },
});

module.exports = mobileRechargeProviders;
