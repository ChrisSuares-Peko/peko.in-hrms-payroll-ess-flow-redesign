
"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const categories = require("./categories");

const payrollDocs = sequelizeConfig.define("payrollDocs", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  documentName: Sequelize.STRING,
  documentUrl: Sequelize.STRING,
  status: {
    type: Sequelize.BOOLEAN,
    defaultValue: true
  }
});
payrollDocs.belongsTo(categories)
module.exports = payrollDocs;