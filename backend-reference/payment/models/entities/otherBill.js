"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const credential = require("./credential");
const payoutBeneficiary = require("./payoutBeneficiary");
const nupayBeneficiary = require("./nupayBeneficiary");

const otherBill = sequelizeConfig.define("otherBill", {
  id: {
    type: Sequelize.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  billTitle: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  payeeName: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  billReferenceNumber: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  dueDate: {
    type: Sequelize.DATEONLY,
    allowNull: false,
  },
  description: {
    type: Sequelize.TEXT,
    allowNull: true,
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
    type: Sequelize.TEXT,
    allowNull: true,
  },
  payoutTransactionId: {
    type: Sequelize.BIGINT,
    allowNull: true,
  },
});

otherBill.belongsTo(credential);
otherBill.belongsTo(payoutBeneficiary);
otherBill.belongsTo(nupayBeneficiary, { foreignKey: "nupayBeneficiaryId", as: "nupayBeneficiary" });

module.exports = otherBill;
