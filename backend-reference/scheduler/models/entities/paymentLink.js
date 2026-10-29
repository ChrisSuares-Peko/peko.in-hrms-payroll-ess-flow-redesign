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
  credentialId: { // this will reference credential id
    type: Sequelize.INTEGER,
    allowNull: false
  },
  paymentLink: Sequelize.STRING, // store vendor url
  client_url: Sequelize.TEXT,  // store shortened url
  status: Sequelize.STRING,
  updates: {
    type: Sequelize.JSON,
    defaultValue: [],
  },
  reference_id: Sequelize.STRING,
  decentro_txn_id: Sequelize.STRING,
  amount: Sequelize.DECIMAL(10, 2),
  expireDate: Sequelize.DATE,
  customerName:{
    type: Sequelize.STRING,
    allowNull: true
  },
  customerPhone:{
    type: Sequelize.STRING,
    allowNull: true
  },
  invoiceId: {
    type: Sequelize.STRING,
    defaultValue: null,
  },
  accessKey:{
    type: Sequelize.STRING,
    defaultValue:"payment_link"
  },
  purpose_message:{
    type: Sequelize.STRING,
    allowNull: true
  },
  type: Sequelize.STRING,
  transactionId: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  createdAt: {
    type: Sequelize.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW
  },
  successOrFailDate: {
    type: Sequelize.DATE,
    allowNull: true
  },
  settledDate: {
    type: Sequelize.DATE,
    allowNull: true
  }

});

paymentLinks.addHook('beforeCreate', async (record) => {
  const count = await paymentLinks.count();
  const next = count + 1;
  record.transactionId = `PYT_TXN${String(next).padStart(4, '0')}`;
});

paymentLinks.belongsTo(credential, { foreignKey: "credentialId" });

module.exports = paymentLinks;
