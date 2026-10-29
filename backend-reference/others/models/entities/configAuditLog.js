"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const credential = require("./credential");

const configAuditLog = sequelizeConfig.define("configAuditLog", {
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    actorId: Sequelize.BIGINT,
    source: {
        type: Sequelize.ENUM("ACCOUNTING_PORTAL", "ADMIN_PANEL"),
        allowNull: false,
    },
    configType: {
        type: Sequelize.STRING(40),
        allowNull: false,
    },
    action: {
        type: Sequelize.ENUM("CREATE", "UPDATE", "DELETE"),
        allowNull: false,
    },
    targetTable: {
        type: Sequelize.STRING(64),
        allowNull: false,
    },
    targetId: Sequelize.BIGINT,
    targetLabel: Sequelize.STRING,
    partnerName: Sequelize.STRING,
    ipAddress: Sequelize.STRING(64),
    changes: {
        type: Sequelize.JSON,
        allowNull: false,
    },
});

configAuditLog.belongsTo(credential, { as: "actor", foreignKey: "actorId", constraints: false });

module.exports = configAuditLog;
