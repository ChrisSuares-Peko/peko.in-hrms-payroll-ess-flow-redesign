'use strict';
const Sequelize = require('sequelize');
const sequelizeConfig = require("../../configs/database/index");
const invoicingV2 = require('./invoicingV2');

const invoiceGuideline = sequelizeConfig.define('invoiceGuideline', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  days: Sequelize.TEXT,
  actionDate: Sequelize.TEXT,
  email: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  sms: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  notification: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  templet: {
    type: Sequelize.JSON,
    allowNull: true,
    defaultValue: {}
  },
  status: {
    type: Sequelize.ENUM('PENDING', 'COMPLETED', 'CANCELLED'),
    defaultValue: "PENDING"
  },
  registeredBy: {
    type: Sequelize.STRING,
    allowNull: true,
  },
})
invoiceGuideline.belongsTo(invoicingV2, { foreignKey: 'invoiceId' })
module.exports = invoiceGuideline