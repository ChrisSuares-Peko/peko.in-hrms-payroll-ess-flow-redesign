"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");

const nicCode = sequelizeConfig.define("nicCode", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  code: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: Sequelize.TEXT
  },
  level: {
    type: Sequelize.STRING // division, group, class, subclass
  },
  parent_code: {
    type: Sequelize.STRING,
    allowNull: true
  }
});


module.exports = nicCode;