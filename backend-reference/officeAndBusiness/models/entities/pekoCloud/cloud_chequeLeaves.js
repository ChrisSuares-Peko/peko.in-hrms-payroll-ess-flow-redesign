"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../../configs/database/index");
const credential = require("../credential");
const cloud_chequeBooks = require("./cloud_chequeBooks");
const SubCorporateUser = require("../subCorporateUsers");

const cloud_chequeLeaves = sequelizeConfig.define("cloud_chequeLeaves", {
  id: {
    type: Sequelize.BIGINT(11),
    primaryKey: true,
    autoIncrement: true,
  },
  type: Sequelize.ENUM("Credit", "Debit"),
  payeeName: Sequelize.STRING,
  chequeBookNumber: Sequelize.STRING,
  bankAccount: Sequelize.STRING,
  chequeNumber: Sequelize.STRING,
  dateOfCheque: Sequelize.DATE,
  dueDate: Sequelize.DATE,
  amount: Sequelize.STRING,
  signedBy: Sequelize.STRING,
  remarks: Sequelize.STRING,
  voucherReferance: Sequelize.STRING,
  document: Sequelize.STRING,
  status: Sequelize.STRING,
});
cloud_chequeLeaves.belongsTo(credential);
cloud_chequeLeaves.belongsTo(cloud_chequeBooks);
cloud_chequeLeaves.belongsTo(SubCorporateUser)

module.exports = cloud_chequeLeaves;
