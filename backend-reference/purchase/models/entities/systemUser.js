/**
 * Created by Imran Noor
 */

"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const credential = require("./credential");
const roleAndPermissions = require("./roleAndPermissions");

const systemUser = sequelizeConfig.define("systemUser", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    email: Sequelize.STRING,
    mobileNo: Sequelize.STRING,
    branding: Sequelize.STRING,
    brandingStatus: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
    },
    isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
    },
    assets: {
        type: Sequelize.JSON,
        defaultValue: null
    },
    registeredBy: {
        type: Sequelize.STRING,
        defaultValue: ''
    },
    subPartnerId: {
        type: Sequelize.STRING,
        defaultValue: null
    },
    portalUrl: Sequelize.STRING,
    sharePercentage: Sequelize.DECIMAL(12, 4),
    gatewayCharge: {
        type: Sequelize.JSON,
        defaultValue: null
    },
    state: {
        type: Sequelize.STRING,
        allowNull: true
    },

});
systemUser.belongsTo(credential); //this will create column named as credentialId which acts as foreignKey
systemUser.belongsTo(roleAndPermissions);
module.exports = systemUser;