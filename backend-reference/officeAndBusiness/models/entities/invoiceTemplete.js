'use strict';
const Sequelize = require('sequelize');
const sequelizeConfig = require("../../configs/database/index");

const invoiceTemplete = sequelizeConfig.define('invoiceTemplete', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  type: {
    type: Sequelize.ENUM('email', 'sms', 'notification', 'invoiceTemplate'),
  },
  subject: Sequelize.TEXT,
  body: Sequelize.TEXT,
  imageUrl: Sequelize.TEXT,
  status: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
  },
})

module.exports = invoiceTemplete