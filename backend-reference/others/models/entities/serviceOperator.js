/**
 * Created by Imran Noor
 */
"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const vendor = require("./vendor");
const oauth_clients = require("./oauth_clients");

const serviceOperators = sequelizeConfig.define("serviceOperators", {
  id: {
    type: Sequelize.BIGINT(11),
    primaryKey: true,
    autoIncrement: true,
  },
  serviceProvider: Sequelize.STRING,
  accessKey: Sequelize.STRING,
  serviceStatus: Sequelize.BOOLEAN,
  providerCommission: {
    type: Sequelize.DECIMAL(10, 4),
    defaultValue: 0.0,
    allowNull: true,
  },
  /*providerCommission: {
        type: Sequelize.STRING,
        allowNull: true,
    },*/
  serviceImage: Sequelize.TEXT,
  serviceCategory: Sequelize.STRING,
  remarks: Sequelize.STRING,
  countryName: Sequelize.STRING,
  countryCode: Sequelize.BIGINT,
  balanceMethod: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
    allowNull: true,
  },
  commissionMode: {
    type: Sequelize.ENUM("MARGIN", "AGENT_MARKUP", "PRINCIPAL_MARKUP"),
    defaultValue: "MARGIN",
  },
  commissionType: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  serviceType: Sequelize.STRING,
  isPlanAvailable: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
  },
  // field used for calculating unit price of the additional features (such as payroll, peko cloud, e sign). if it true it is based on the remaing subscription days
  isDynamicUnitPricing: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
  },
  paymentclientid: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  paymentclientsecret: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  recordJournalEntry: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
    allowNull: true,
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
serviceOperators.belongsTo(vendor);
serviceOperators.belongsTo(oauth_clients);
module.exports = serviceOperators;
