/**
 * Created by Imran Noor
 */
const Sequelize = require('sequelize')
const sequelizeConfig = require("../../configs/database/index");
const serviceOperator = require("./serviceOperator")
const credential = require("./credential")
const order = require("./order");
const sequelize = require('sequelize');

const transaction = sequelizeConfig.define('transaction', {
    id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true
    },
    corporateTxnId: Sequelize.STRING,
    transactionId: sequelize.STRING,//On the recommendation of Asif Sir, it was added.           
    transactionDate: Sequelize.DATE,
    transactionType: Sequelize.STRING, // CREDIT DEBIT
    transactionCategory: Sequelize.STRING, // FUND TRANSFER,SELF TRANSFER
    debitAmount: Sequelize.DECIMAL(12, 4),
    creditAmount: Sequelize.DECIMAL(12, 4),
    totalCashback: Sequelize.DECIMAL(12, 4),
    corporateCashback: Sequelize.DECIMAL(12, 4),
    systemCashback: Sequelize.DECIMAL(12, 4),
    balance: {
        type: Sequelize.DECIMAL(12, 4),
        defaultValue: 0.0
    },
    remarks: Sequelize.STRING,
    status: Sequelize.STRING,
    providerId: Sequelize.STRING,
    commissionDetails: Sequelize.JSON,
    batchId: {
        type: Sequelize.STRING,
        allowNull: true,
    }
})
transaction.belongsTo(serviceOperator)
transaction.belongsTo(credential)
transaction.belongsTo(order)
module.exports = transaction