"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../../configs/database/index");
const credential = require("../credential");
const SubCorporateUser = require("../subCorporateUsers");

const cloud_chequeBooks = sequelizeConfig.define("cloud_chequeBooks", {
  id: {
    type: Sequelize.BIGINT(11),
    primaryKey: true,
    autoIncrement: true,
  },
  bookId: Sequelize.STRING,
  accountName: Sequelize.STRING,
  accountNumber: Sequelize.STRING,
  bankName: Sequelize.STRING,
  currency: Sequelize.STRING,
  currencyDivision: Sequelize.STRING,
  chequeStarting: Sequelize.STRING,
  numberOfLeaves: Sequelize.STRING,
  accountBalance: Sequelize.STRING,
  document: Sequelize.STRING,
  status: Sequelize.STRING,
});
cloud_chequeBooks.belongsTo(credential);
cloud_chequeBooks.belongsTo(SubCorporateUser)
module.exports = cloud_chequeBooks;
