'use strict';
const Sequelize = require('sequelize');
const sequelizeConfig = require("../../configs/database/index");
const corporateUser = require("./corporateUser");
 
const invoiceCustomer = sequelizeConfig.define('invoiceCustomer', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  name: Sequelize.STRING,
  email: Sequelize.STRING,
  phoneNumber: Sequelize.STRING,
  address: Sequelize.STRING,
  trnNo: Sequelize.STRING,
});
 
// invoiceCustomer.belongsTo(credential);
invoiceCustomer.belongsTo(corporateUser);
 
module.exports = invoiceCustomer;