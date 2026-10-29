"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");

const ip_whitelist = sequelizeConfig.define("ip_whitelist", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    ip: {
        type: Sequelize.STRING
    },   
    status: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
    partnerId: Sequelize.STRING,
});
module.exports = ip_whitelist