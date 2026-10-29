"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const corporateUser = require("./corporateUser");
const SubCorporateUser = require("./subCorporateUsers");

// Per-slab GST figures for the GST summary report. A cash-basis income/expense ledger
// has no tax breakup (rate / CGST / SGST / IGST / ITC), so these are stored. One row =
// a tax event for a slab dated by `txnDate`; the report sums rows by rate within [from,
// to] and derives outputGst (=cgst+sgst+igst) and netPayable (=outputGst-itc).
const gstRateEntry = sequelizeConfig.define(
    "gstRateEntries",
    {
        id: {
            type: Sequelize.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        rate: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        taxable: {
            type: Sequelize.DECIMAL(14, 2),
            allowNull: false,
            defaultValue: 0,
        },
        itc: {
            type: Sequelize.DECIMAL(14, 2),
            allowNull: false,
            defaultValue: 0,
        },
        cgst: {
            type: Sequelize.DECIMAL(14, 2),
            allowNull: false,
            defaultValue: 0,
        },
        sgst: {
            type: Sequelize.DECIMAL(14, 2),
            allowNull: false,
            defaultValue: 0,
        },
        igst: {
            type: Sequelize.DECIMAL(14, 2),
            allowNull: false,
            defaultValue: 0,
        },
        txnDate: {
            type: Sequelize.DATEONLY,
            allowNull: false,
        },
        note: {
            type: Sequelize.TEXT,
            allowNull: true,
            defaultValue: null,
        },
        isActive: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
    },
    {
        paranoid: true,
        indexes: [
            { fields: ["corporateUserId"] },
            { fields: ["corporateUserId", "txnDate"] },
            { fields: ["corporateUserId", "rate"] },
        ],
    }
);

gstRateEntry.belongsTo(corporateUser);
gstRateEntry.belongsTo(SubCorporateUser);

module.exports = gstRateEntry;
