
"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const categories = require("./payrollCategories");

const payrollDocs = sequelizeConfig.define("payrollDocs", {
    corporateUser: {
        type: String,
        ref: 'CorporateUser',
        required: true,
    },
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    documentName: Sequelize.STRING,
    documentUrl: Sequelize.STRING,
    status: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
    }
});
payrollDocs.belongsTo(categories)
module.exports = payrollDocs;