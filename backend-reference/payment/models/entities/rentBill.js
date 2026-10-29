"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const credential = require("./credential");
const payoutBeneficiary = require("./payoutBeneficiary");
const nupayBeneficiary = require("./nupayBeneficiary");

const rentBill = sequelizeConfig.define("rentBill", {
  id: {
    type: Sequelize.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  landlordName: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  propertyAddress: {
    type: Sequelize.TEXT,
    allowNull: false,
  },
  rentPeriod: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  dueDate: {
    type: Sequelize.DATEONLY,
    allowNull: false,
  },
  rentAmount: {
    type: Sequelize.DECIMAL(12, 2),
    allowNull: false,
  },
  maintenanceCharges: {
    type: Sequelize.DECIMAL(12, 2),
    allowNull: true,
    defaultValue: 0,
  },
  totalAmount: {
    type: Sequelize.DECIMAL(12, 2),
    allowNull: false,
  },
  leaseAgreementNumber: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  notes: {
    type: Sequelize.TEXT,
    allowNull: true,
  },
  // UNPAID | PAID | OVERDUE
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

rentBill.belongsTo(credential);
rentBill.belongsTo(payoutBeneficiary);
rentBill.belongsTo(nupayBeneficiary, { foreignKey: "nupayBeneficiaryId", as: "nupayBeneficiary" });

module.exports = rentBill;
