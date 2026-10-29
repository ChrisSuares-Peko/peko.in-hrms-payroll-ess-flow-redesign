"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const credential = require("./credential");

const paymentLinks = sequelizeConfig.define("paymentLinks", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  sentPayload: {
    type: Sequelize.JSON,
    defaultValue: {},
  },
  paymentLink: Sequelize.STRING, // store vendor url
  status: Sequelize.STRING,
  updates: {
    type: Sequelize.JSON,
    defaultValue: [],
  },
  reference_id: Sequelize.STRING,
  decentro_txn_id: Sequelize.STRING,
  invoiceId: {
    type: Sequelize.STRING,
    defaultValue: null,
  },
  amount: Sequelize.DECIMAL(10, 2),
  expireDate: Sequelize.DECIMAL(10, 2),
  type: Sequelize.STRING,
});

paymentLinks.belongsTo(credential);
module.exports = paymentLinks;
