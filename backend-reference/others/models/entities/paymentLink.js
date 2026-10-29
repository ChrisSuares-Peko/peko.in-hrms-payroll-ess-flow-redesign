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
   client_url: Sequelize.TEXT, 
  status: Sequelize.STRING,
  updates: {
    type: Sequelize.JSON,
    defaultValue: [],
  },
  reference_id: Sequelize.STRING,
  decentro_txn_id: Sequelize.STRING,
  amount: Sequelize.DECIMAL(10, 2),
  expireDate: Sequelize.DECIMAL(10, 2),
  invoiceId: {
    type: Sequelize.STRING,
    defaultValue: null,
  },
  type: Sequelize.STRING,
});

paymentLinks.belongsTo(credential);
module.exports = paymentLinks;
