"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const credential = require("./credential")
const serviceOperators = require("./serviceOperator");

const beneficiary = sequelizeConfig.define("beneficiary", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    accessKey: Sequelize.STRING,
    name: Sequelize.STRING,
    phoneNo: Sequelize.STRING,
    serviceProvider: Sequelize.STRING,
    billerId: Sequelize.STRING, //service provider id 
    providerCircle: Sequelize.STRING,
    isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
    },
    customerParams: {
        type: Sequelize.JSON,
        defaultValue: []
    }
});
beneficiary.belongsTo(credential); //this will create column named as credentialId which acts as foreignKey
beneficiary.belongsTo(serviceOperators)

module.exports = beneficiary;