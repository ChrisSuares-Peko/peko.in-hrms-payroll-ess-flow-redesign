'use strict';
const Sequelize = require('sequelize');
const sequelizeConfig = require("../../configs/database/index");

const CoaRules = sequelizeConfig.define("coa_rules", {
  id: {
    type: Sequelize.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },

  entityType: {
    type: Sequelize.DataTypes.ENUM("vendor", "partner", "corporate"),
    allowNull: false,
  },

  prefix: {
    type: Sequelize.STRING,
    allowNull: false,
  },

  accountType: {
    type: Sequelize.STRING,
    allowNull: false,
  },

  parentAccountId: {
    type: Sequelize.STRING,
    allowNull: true,
  },

  description: {
    type: Sequelize.TEXT,
    allowNull: true,
  },

  isActive: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
  }
}, {
  tableName: "coa_rules",
  timestamps: true
});

module.exports = CoaRules;
