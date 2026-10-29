/**
 * Created by Imran Noor
 */
'use strict';
const Sequelize = require('sequelize');
const sequelizeConfig = require("../../configs/database/index");

const PG_Orders = sequelizeConfig.define('paymentGatewayOrders', {
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    paymentRefId:Sequelize.STRING,
    referenceNo:Sequelize.STRING,
    paymentData: Sequelize.TEXT,
    status: {
        type: Sequelize.ENUM('PENDING','ORDERED','COMPLETE','FAILED'),
        defaultValue: 'PENDING'
    },
    paymentResponse: {
        type: Sequelize.TEXT,
        allowNull: true
    }
})
module.exports = PG_Orders