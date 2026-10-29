'use strict'
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");

var signUp = sequelizeConfig.define('signUp', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  firstName: {
    type: Sequelize.STRING
  },
  lastName: {
    type: Sequelize.STRING
  },
  username: {
    type: Sequelize.STRING,
    unique: true
  },
  designation: {
    type: Sequelize.STRING
  },
  name: Sequelize.STRING,
  email: Sequelize.STRING,
  mobileNo: Sequelize.STRING,
  businessRegNo: Sequelize.STRING,
  contactPersonName: Sequelize.STRING,
  contactPersonNumber: Sequelize.STRING,
  website: Sequelize.STRING,
  contactPersonEmail: Sequelize.STRING,
  country: Sequelize.STRING,
  countryCode: Sequelize.STRING,
  address: Sequelize.STRING,
  city: Sequelize.STRING,
  companySize: Sequelize.STRING,
  status: {
    type: Sequelize.STRING,
    defaultValue: 'PENDING'
  }
})

module.exports = signUp