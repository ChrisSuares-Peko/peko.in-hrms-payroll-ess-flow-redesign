'use strict';
const Sequelize = require('sequelize');
const sequelizeConfig = require("../../configs/database/index");
const order = require("./order")

const Payouts = sequelizeConfig.define('payouts', {
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    paymentRefId: Sequelize.STRING,
    payoutResponse: Sequelize.TEXT,
    status: Sequelize.STRING,
    payoutUpdates: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: []
    },
    remarks: Sequelize.STRING,
    updateDetails: {  //here we are saving the updateDetails that need to be sended to refundWalletTransaction after admin authorize refund
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {}
    },
})

Payouts.belongsTo(order)
module.exports = Payouts