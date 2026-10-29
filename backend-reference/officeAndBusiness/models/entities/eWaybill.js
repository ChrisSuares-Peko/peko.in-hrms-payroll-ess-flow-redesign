"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const corporateUser = require("./corporateUser");
const SubCorporateUser = require("./subCorporateUsers");

const eWaybill = sequelizeConfig.define("eWaybill", {
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    // Result fields from Alankit
    ewbNo: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    ewbDt: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    ewbValidTill: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    // Transport input fields
    distance: {
        type: Sequelize.INTEGER,
        allowNull: true,
    },
    transMode: {
        type: Sequelize.STRING(1),
        allowNull: true,
    },
    transId: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    transName: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    vehNo: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    vehType: {
        type: Sequelize.STRING(1),
        allowNull: true,
    },
    transDocNo: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    transDocDt: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    status: {
        type: Sequelize.ENUM("ACTIVE", "CANCELLED"),
        defaultValue: "ACTIVE",
    },
    cancelledDate: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    cancelReason: {
        type: Sequelize.STRING,
        allowNull: true,
    },
});

eWaybill.belongsTo(corporateUser);
eWaybill.belongsTo(SubCorporateUser);

module.exports = eWaybill;
