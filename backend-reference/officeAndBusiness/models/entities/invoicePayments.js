/**
 * Created by Imran Noor
 */

"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");

const invoicePayments = sequelizeConfig.define("invoicePayments", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    date: Sequelize.DATE,
    vendor: Sequelize.STRING,
    amount: Sequelize.STRING,
    dueDate: Sequelize.DATE,
    invoiceNo: Sequelize.TEXT,
    invoiceURL: Sequelize.TEXT,
    status: {
        type: Sequelize.ENUM('UN-PAID', 'PAID'),
        defaultValue: 'UN-PAID'
    }
});
module.exports = invoicePayments;