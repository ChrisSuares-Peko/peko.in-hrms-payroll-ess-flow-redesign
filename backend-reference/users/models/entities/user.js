"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const credential = require("./credential");

const User = sequelizeConfig.define("user", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: Sequelize.STRING,
  email: Sequelize.STRING,
  mobileNo: Sequelize.STRING,
  corporateUserId: Sequelize.INTEGER,
  // Stores the MongoDB ObjectId of the employee profile in the payroll service
  employeeId: Sequelize.STRING,
  userAccessService: {
    type: Sequelize.JSON,
    allowNull: true,
  },
  isActive: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
  },
  isDeleted: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
});

User.belongsTo(credential);

module.exports = User;
