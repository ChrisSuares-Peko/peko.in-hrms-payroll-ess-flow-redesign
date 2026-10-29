'use strict';
const Sequelize = require('sequelize');
const sequelizeConfig = require("../../configs/database/index");
const credential = require('./credential');
const SubCorporateUser = require('./subCorporateUsers');
const { ESIGN_SOURCE_TYPE_VALUES } = require('../../constants/eSignSourceTypes');

const eSign = sequelizeConfig.define('eSign', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  docket_id: {
    type: Sequelize.STRING,
    required: true
  },
  document_id: {
    type: Sequelize.STRING,
    required: true
  },
  docket_title: {
    type: Sequelize.STRING,
    required: true
  },
  docket_description: {
    type: Sequelize.STRING,
    required: true
  },
  expiry_date: {
    type: Sequelize.DATE,
    required: true
  },
  doc_expiry_date: {
    type: Sequelize.DATE,
    required: true
  },
  sequentialSignature: {
    type: Sequelize.BOOLEAN,
    required: true
  },
  signers_info: {
    type: Sequelize.JSON,
    required: true
  },
  initiator_name: {
    type: Sequelize.STRING,
    required: true
  },
  initiator_email: {
    type: Sequelize.STRING,
    required: true
  },
  document_url: {
    type: Sequelize.STRING,
    required: true
  },
  reminder: {
    type: Sequelize.BOOLEAN,
    required: true
  },
  termsofUse: {
    type: Sequelize.BOOLEAN,
    required: true
  },
  reminder_interval: {
    type: Sequelize.INTEGER,
    required: true
  },
  audit_trail_url: {
    type: Sequelize.STRING,
  },
  eSignType: {
    type: Sequelize.STRING,
  },
  status: {
    type: Sequelize.ENUM('PENDING', 'COMPLETED', 'REJECTED', 'EXPIRED'),
    defaultValue: 'PENDING'
  },
  consentAgreed: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  consentAt: {
    type: Sequelize.DATE,
    allowNull: true,
    defaultValue: null
  },
  sourceType: {
    type: Sequelize.STRING,
    allowNull: true,
    defaultValue: null,
    validate: {
      isIn: [ESIGN_SOURCE_TYPE_VALUES]
    }
  },
  sourceId: {
    type: Sequelize.STRING,
    allowNull: true,
    defaultValue: null
  }

});

eSign.belongsTo(credential)
eSign.belongsTo(SubCorporateUser)

module.exports = eSign;
