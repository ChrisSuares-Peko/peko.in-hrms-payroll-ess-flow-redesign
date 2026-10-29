"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const corporateUser = require("./corporateUser");
const SubCorporateUser = require("./subCorporateUsers");

const invoiceRecurring = sequelizeConfig.define("invoiceRecurrings", {
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },

    scheduleName: {
        type: Sequelize.STRING,
        allowNull: false,
    },

    // { every: number, unit: "DAYS"|"WEEKS"|"MONTHS"|"QUARTERS"|"YEARS" }
    frequency: {
        type: Sequelize.JSON,
        allowNull: false,
    },

    startDate: {
        type: Sequelize.DATEONLY,
        allowNull: true,
    },

    // Advances after each run; null when ENDED
    nextRunDate: {
        type: Sequelize.DATEONLY,
        allowNull: true,
    },

    // { type: "FOREVER"|"AFTER"|"ON", runs?: number, date?: string }
    endCondition: {
        type: Sequelize.JSON,
        allowNull: true,
    },

    status: {
        type: Sequelize.ENUM("ACTIVE", "PAUSED", "ENDED"),
        defaultValue: "ACTIVE",
    },

    // Auto-email the generated invoice PDF to the customer on each run
    autoSend: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
    },

    completedRuns: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
    },

    // Array of { invoiceId, invoiceNo, prefix, total, invoiceDate, createdAt }
    generatedInvoices: {
        type: Sequelize.JSON,
        defaultValue: [],
    },

    // FK to invoicings.id — the template invoice to clone on each run
    sourceInvoiceId: {
        type: Sequelize.BIGINT,
        allowNull: true,
    },

    corporateUserId: {
        type: Sequelize.BIGINT,
        allowNull: true,
    },

    subCorporateUserId: {
        type: Sequelize.BIGINT,
        allowNull: true,
    },
});

invoiceRecurring.belongsTo(corporateUser);
invoiceRecurring.belongsTo(SubCorporateUser);

module.exports = invoiceRecurring;
