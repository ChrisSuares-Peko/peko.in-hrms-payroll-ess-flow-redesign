"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const corporateUser = require("./corporateUser");
const SubCorporateUser = require("./subCorporateUsers");

// Stored balance-sheet heads for figures the income/expense ledger cannot derive
// (inventory, fixed assets, loans, capital, GST/TDS payable, etc.). The balance
// sheet report merges these with the derived heads (cash, A/R, retained earnings,
// current-year profit). One row = the balance of a single head as of `asOfDate`;
// the report picks the latest row per (section, head) with asOfDate <= the as-of.
const balanceSheetEntry = sequelizeConfig.define(
    "balanceSheetEntries",
    {
        id: {
            type: Sequelize.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        section: {
            type: Sequelize.ENUM(
                "currentAssets",
                "nonCurrentAssets",
                "currentLiabilities",
                "longTermLiabilities",
                "equity"
            ),
            allowNull: false,
        },
        head: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        // Signed balance; negative allowed for contra heads (e.g. Accumulated Depreciation).
        amount: {
            type: Sequelize.DECIMAL(14, 2),
            allowNull: false,
            defaultValue: 0,
        },
        asOfDate: {
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
            { fields: ["corporateUserId", "section"] },
            { fields: ["corporateUserId", "asOfDate"] },
        ],
    }
);

balanceSheetEntry.belongsTo(corporateUser);
balanceSheetEntry.belongsTo(SubCorporateUser);

module.exports = balanceSheetEntry;
