/**
 * Created by Imran Noor
 */
"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const corporateUser = require("./credential");
const SubCorporateUser = require("./subCorporateUsers");

const invoices = sequelizeConfig.define("invoices", {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  recipientDetails: Sequelize.TEXT,
  invoiceDetails: Sequelize.TEXT,
  productDetails: Sequelize.TEXT,
  paymentDetails: Sequelize.TEXT,
  comments: Sequelize.TEXT,
  termsConditions: Sequelize.TEXT,
  paymentMode: Sequelize.STRING,
  status: {
    type: Sequelize.ENUM("PENDING", "PAID", "EXPIRED"),
    defaultValue: "PENDING",
  },
  dueDate: {
    type: Sequelize.TEXT,
    allowNull: true,
  },
  amount: {
    type: Sequelize.TEXT,
    allowNull: true,
  },
  paymentLink: {
    type: Sequelize.TEXT,
    allowNull: true,
  },
});
invoices.belongsTo(corporateUser);
invoices.belongsTo(SubCorporateUser)

module.exports = invoices;
