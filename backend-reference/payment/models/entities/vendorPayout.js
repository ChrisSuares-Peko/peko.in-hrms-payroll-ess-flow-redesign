"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const credential = require("./credential");
const payoutBeneficiary = require("./payoutBeneficiary");
const nupayBeneficiary = require("./nupayBeneficiary");

const vendorPayout = sequelizeConfig.define("vendorPayout", {
  id: {
    type: Sequelize.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  vendorName: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  invoiceNumber: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  invoiceDate: {
    type: Sequelize.DATEONLY,
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
    type: Sequelize.STRING,
    allowNull: true,
  },
  payoutTransactionId: {
    type: Sequelize.BIGINT,
    allowNull: true,
  },
});

vendorPayout.belongsTo(credential);
vendorPayout.belongsTo(payoutBeneficiary);
vendorPayout.belongsTo(nupayBeneficiary, { foreignKey: "nupayBeneficiaryId", as: "nupayBeneficiary" });

module.exports = vendorPayout;
