"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../../configs/database/index");
const credential = require('../credential');

const kybDetails = sequelizeConfig.define("kybDetails", {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    icRegNumber: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    companyName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    tradeName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    offWebsite: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    offEmail: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    contactPersonName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    phoneNumber: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    legalStatus: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    OtherlegalStatus: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    natureOfBusiness: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    countryOfIncorporation: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    dateOfIncorporation: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    TLNumber: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    TLIssuingAuthority: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    expiryDateofTL: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    VATTRN: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    tradeLicense: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    corporateAddress: {
      type: Sequelize.JSON,
      allowNull: false,
    },
    shareholders: {
      type: Sequelize.JSON, 
      allowNull: false,
    },
    status: {
      type: Sequelize.ENUM('PENDING', 'RE UPLOAD', 'COMPLETED'),
      defaultValue: 'PENDING'
    },
    remarks: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    authorizedPersonName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    authorizedPersonNationality: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    authorizedPersonID: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    hasPresenceInIranOrNorthKorea: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
    },
  });
  
  kybDetails.belongsTo(credential);
  
  module.exports = kybDetails;
