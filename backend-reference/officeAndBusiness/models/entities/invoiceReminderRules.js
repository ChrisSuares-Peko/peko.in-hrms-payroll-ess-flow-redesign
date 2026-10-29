"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const corporateUser = require("./corporateUser");

const invoiceReminderRules = sequelizeConfig.define("invoiceReminderRules", {
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    corporateUserId: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    ruleType: {
        type: Sequelize.ENUM('BEFORE', 'ON_DUE', 'AFTER', 'SECOND_OVERDUE'),
        allowNull: false,
    },
    days: {
        type: Sequelize.INTEGER,
        allowNull: true,
    },
    enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
    },
    sendEmail: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
    },
    sendWhatsApp: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
    },
    emailTemplate: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null,
    },
    whatsappTemplate: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null,
    },
});

invoiceReminderRules.belongsTo(corporateUser);

module.exports = invoiceReminderRules;
