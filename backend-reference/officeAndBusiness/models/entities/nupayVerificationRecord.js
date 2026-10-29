'use strict';
const Sequelize = require('sequelize');
const sequelizeConfig = require("../../configs/database/index");
const credentials = require("./credential");

const nupayVerificationRecord = sequelizeConfig.define('nupayVerificationRecord', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  accessKey: {
    type: Sequelize.STRING,
    allowNull: false
  },
  verificationType: {
    type: Sequelize.STRING,
    allowNull: true
  },
  credentialId: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  corporateUserId: {
    type: Sequelize.INTEGER,
    allowNull: true
  },
  packageId: {
    type: Sequelize.INTEGER,
    allowNull: true
  },
  referenceNumber: {
    type: Sequelize.STRING(20),
    allowNull: true,
    unique: true
  },
  transactionId: {
    type: Sequelize.STRING,
    allowNull: true
  },
  status: {
    type: Sequelize.ENUM('PENDING', 'VALID', 'INVALID'),
    allowNull: false,
    defaultValue: 'PENDING'
  },
  inputPayload: {
    type: Sequelize.JSON,
    allowNull: true
  },
  responsePayload: {
    type: Sequelize.JSON,
    allowNull: true
  },
  errorCode: {
    type: Sequelize.STRING,
    allowNull: true
  },
  message: {
    type: Sequelize.STRING,
    allowNull: true
  },
}, {
  tableName: 'nupay_verification_records'
});

nupayVerificationRecord.belongsTo(credentials);

module.exports = nupayVerificationRecord;
