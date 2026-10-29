"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const credential = require("./credential");

const WhatsAppBusiness = sequelizeConfig.define("WhatsAppBusiness", {
    id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true
    },
    businessId: Sequelize.STRING,
    projectId: {
        type: Sequelize.STRING,
        allowNull: true
    }
});

WhatsAppBusiness.belongsTo(credential);

module.exports = WhatsAppBusiness;
