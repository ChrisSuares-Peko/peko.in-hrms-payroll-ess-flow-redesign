"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const credential = require("./credential");
const transaction = require("./transaction");
const order = require("./order");
const SubCorporateUser = require("./subCorporateUsers");

const busBooking = sequelizeConfig.define("busBooking", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    tin: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    pnr: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    bookingStatus: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    travels: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    busType: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    tripDetails: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {},
    },
    passengers: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: [],
    },
    fare: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {},
    },
    cancellationPolicy: {
        type: Sequelize.TEXT,
        allowNull: true,
    },
    cancellationDate: {
        type: Sequelize.DATE,
        allowNull: true,
    },
    refundedAmount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
    },
});

busBooking.belongsTo(credential);
busBooking.belongsTo(transaction);
busBooking.belongsTo(order);
order.hasOne(busBooking, { foreignKey: 'orderId' });
busBooking.belongsTo(SubCorporateUser);

module.exports = busBooking;
