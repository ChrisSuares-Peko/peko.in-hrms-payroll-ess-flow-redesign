"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const credential = require("./credential");
const transaction = require("./transaction");
const SubCorporateUser = require("./subCorporateUsers");

const documentAttestation = sequelizeConfig.define("documentAttestation", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    documentType: Sequelize.STRING,
    issuedCountry: Sequelize.STRING,
    submissionCountry: Sequelize.STRING,
    passportDoc:Sequelize.STRING,
    address: Sequelize.STRING,
    poBox: Sequelize.STRING,
    contactPersonPhone: Sequelize.STRING,
    remarks: Sequelize.STRING,
    amount: {
        type: Sequelize.DECIMAL(12, 4),
        defaultValue: 0.0
    },
    status: {
        type: Sequelize.ENUM('PICKUP','ASSIGNED', 'PROCESSING','DISPATCHED','COMPLETED'),
        defaultValue: 'PICKUP'
      },
    email: Sequelize.STRING,
});

documentAttestation.belongsTo(credential)
documentAttestation.belongsTo(transaction)
documentAttestation.belongsTo(SubCorporateUser)
module.exports = documentAttestation;