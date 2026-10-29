/**
 * Created by Imran Noor
 */

"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const credential = require("./credential");

const quickLinks = sequelizeConfig.define("quickLinks", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    sentPayload: Sequelize.TEXT,
    response: Sequelize.TEXT,
    invoiceId: {
        type: Sequelize.STRING,
        defaultValue: null
    }
});
quickLinks.belongsTo(credential)
module.exports = quickLinks;