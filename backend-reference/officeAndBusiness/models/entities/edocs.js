/**
 * Created by Imran Noor
 */

"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const categories = require("./categories");

const edocs = sequelizeConfig.define("edocs", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  //documentType: Sequelize.STRING,
  documentName: Sequelize.STRING,
  description: Sequelize.TEXT,
  documentUrl: Sequelize.STRING,
  status: {
    type: Sequelize.BOOLEAN,
    defaultValue: true
  }
});
edocs.belongsTo(categories)
module.exports = edocs;