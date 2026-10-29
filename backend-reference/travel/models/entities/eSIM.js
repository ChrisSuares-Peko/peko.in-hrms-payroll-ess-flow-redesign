"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const credential = require("./credential");
const transaction = require("./transaction");
const SubCorporateUser = require("./subCorporateUsers");

const eSIM = sequelizeConfig.define("eSIM", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    packageDetails: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {}
    },
    simDetails: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: []
    },
    remarks: {
        type: Sequelize.STRING,
        allowNull: true, 
    },
    quantity: {
        type: Sequelize.INTEGER,
        allowNull: true, 
    },
    amount: {
        type: Sequelize.INTEGER,
        allowNull: true, 
    }
});

eSIM.belongsTo(credential)
eSIM.belongsTo(transaction)
eSIM.belongsTo(SubCorporateUser)
module.exports = eSIM;