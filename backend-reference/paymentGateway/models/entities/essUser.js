"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");

// Read-only view of the users service's employee (ESS) profile table: the row a cardholder's card is keyed on.
const essUser = sequelizeConfig.define(
  "essUser",
  {
    id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
    credentialId: { type: Sequelize.INTEGER, allowNull: true },
    corporateUserId: { type: Sequelize.INTEGER, allowNull: true },
    isActive: { type: Sequelize.BOOLEAN, allowNull: true },
    isDeleted: { type: Sequelize.BOOLEAN, allowNull: true },
  },
  { tableName: "users" }
);

module.exports = essUser;
