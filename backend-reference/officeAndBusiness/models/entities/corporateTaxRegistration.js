'use strict';
const Sequelize = require('sequelize');
const sequelizeConfig = require("../../configs/database/index");
const credential = require('./credential');

const corporateTaxRegistration = sequelizeConfig.define('corporateTaxRegistration', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  companyName: {
    type: Sequelize.STRING,
    required: true
  },
  tradeLicenseDoc: {
    type: Sequelize.JSON,
    required: true
  },
  corporateGovernanceDoc: {
    type: Sequelize.STRING,
    required: true
  },
  emiratesIDDoc: {
    type: Sequelize.STRING,
    required: true
  },
  passportDoc: {
    type: Sequelize.STRING,
    required: true
  },

  taxPeriod: {
    type: Sequelize.STRING,
    required: true
  },

  contactPerson: {
    type: Sequelize.STRING,
    required: true
  },
  phoneNumber: {
    type: Sequelize.STRING,
    required: true
  },
  email: {
    type: Sequelize.STRING,
    required: true
  },
  selfDeclaration: {
    type: Sequelize.BOOLEAN,
    required: true
  },
  amount: {
    type: Sequelize.DECIMAL(10, 2),
    required: true
  },
  quantity: {
    type: Sequelize.INTEGER,
    allowNull: true
  },
  status: {
    type: Sequelize.ENUM('PENDING', 'RE UPLOAD', 'COMPLETED'),
    defaultValue: 'PENDING'
  },
  remarks: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  taxCertificateDoc: {
    type: Sequelize.STRING,
    allowNull: true
  },
});

corporateTaxRegistration.belongsTo(credential)

module.exports = corporateTaxRegistration;
