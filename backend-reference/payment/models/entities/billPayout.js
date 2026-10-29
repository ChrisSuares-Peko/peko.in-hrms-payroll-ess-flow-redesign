"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const credential = require("./credential");
const payoutBeneficiary = require("./payoutBeneficiary");

const billPayout = sequelizeConfig.define("billPayout", {
  id: {
    type: Sequelize.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  billTitle: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  billerName: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  billNumber: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  billPeriod: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  dueDate: {
    type: Sequelize.DATEONLY,
    allowNull: false,
  },
  totalAmount: {
    type: Sequelize.DECIMAL(12, 2),
    allowNull: false,
  },
  notes: {
    type: Sequelize.TEXT,
    allowNull: true,
  },
  status: {
    type: Sequelize.ENUM("UNPAID", "PAID", "OVERDUE"),
    defaultValue: "UNPAID",
  },
  attachmentUrl: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  payoutTransactionId: {
    type: Sequelize.BIGINT,
    allowNull: true,
  },
});

billPayout.belongsTo(credential);
billPayout.belongsTo(payoutBeneficiary);

module.exports = billPayout;
