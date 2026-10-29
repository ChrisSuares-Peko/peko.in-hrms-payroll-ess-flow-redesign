"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const corporateUser = require("./corporateUser");
const SubCorporateUser = require("./subCorporateUsers");

// Stored cash-flow line items for figures a cash-basis ledger can't derive on its own
// (depreciation add-backs, working-capital changes, capex, financing). The cash flow
// report merges these with the derived Net Profit (operating) and opening balance.
// One row = a signed cash movement (inflow +, outflow -) dated by `txnDate`; the report
// sums rows by (section, head) within the requested [from, to] range.
const cashFlowEntry = sequelizeConfig.define(
    "cashFlowEntries",
    {
        id: {
            type: Sequelize.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        section: {
            type: Sequelize.ENUM("operating", "investing", "financing"),
            allowNull: false,
        },
        head: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        // Signed rupees; inflow positive, outflow negative.
        amount: {
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
            { fields: ["corporateUserId", "section"] },
        ],
    }
);

cashFlowEntry.belongsTo(corporateUser);
cashFlowEntry.belongsTo(SubCorporateUser);

module.exports = cashFlowEntry;
