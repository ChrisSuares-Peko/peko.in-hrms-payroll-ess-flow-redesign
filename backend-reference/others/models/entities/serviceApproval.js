"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const partnerPermission = require("./partnerPermission");

const serviceApprovals = sequelizeConfig.define("serviceApprovals", {
    id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
    },
    partnerPermissionId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        unique: true,
    },
    registeredBy: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    approvals: {
        type: Sequelize.JSON,
        allowNull: false,
    },
});

serviceApprovals.belongsTo(partnerPermission, { foreignKey: "partnerPermissionId" });

module.exports = serviceApprovals;
