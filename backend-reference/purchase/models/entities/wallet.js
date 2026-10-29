/**
 * Created by Imran Noor
 */
"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const credentials = require("./credential")

const wallet = sequelizeConfig.define("wallet", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    // cashbackBalance: {
    
    //     type: Sequelize.DECIMAL(12, 4),
    //     defaultValue: 0.0
    // },
    balance: {
        type: Sequelize.DECIMAL(12, 4),
        defaultValue: 0.0
    }
});
wallet.belongsTo(credentials)
module.exports = wallet;
