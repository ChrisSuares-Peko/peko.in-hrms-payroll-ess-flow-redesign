"use strict";
const Sequelize = require("sequelize");
const sequelize = require("../../configs/database/index");

const esimPlans = sequelize.define("esimPlans", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: Sequelize.STRING,
  provider: Sequelize.STRING,
  networks: {
    type: Sequelize.JSON,
    allowNull: true,
  },
  country: Sequelize.TEXT,
  coverageId: Sequelize.STRING,
  planId: Sequelize.STRING,
  dataMBs: Sequelize.STRING,
  periodDays: Sequelize.STRING,
  amount: Sequelize.DECIMAL(10, 4),
  vendorWholesalePriceUSD: {
    type: Sequelize.DECIMAL(10, 4),
    allowNull: true
  },
  status: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  includedCountries: {
    type: Sequelize.JSON,
    allowNull: true,
  },
  commissionMode: {
    type: Sequelize.ENUM('MARGIN', 'AGENT_MARKUP', 'PRINCIPAL_MARKUP'),
    defaultValue: 'MARGIN',
  },
  commissionType: {
    type: Sequelize.ENUM('PERCENTAGE', 'FLAT'),
    defaultValue: 'PERCENTAGE',
  },
  commission: {
    type: Sequelize.DECIMAL(10, 4),
    defaultValue: 0,
  },
  fixedCommissionPerTransaction: {
    type: Sequelize.DECIMAL(10, 4),
    defaultValue: 0,
  },
  isCommissionInclGST: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
  },
  isCommissionConfigured: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  },
});

module.exports = esimPlans;