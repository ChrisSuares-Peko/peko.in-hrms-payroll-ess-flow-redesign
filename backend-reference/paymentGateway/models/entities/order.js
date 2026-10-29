/**
 * Created by Imran Noor
 */

const Sequelize = require('sequelize')
const sequelizeConfig = require("../../configs/database/index");
const serviceOperator = require("./serviceOperator")
const credential = require("./credential");
const SubCorporateUser = require('./subCorporateUsers');
const userCoupons = require("./userCoupons")
const { derivePaymentInstrument } = require("../../utils/paymentInstrument")
const couponCode = require("./couponCode")

const orders = sequelizeConfig.define('orders', {
    id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true
    },
    corporateTxnId: {
        type: Sequelize.STRING,
        unique: true
    },
    operatorId: Sequelize.STRING,
    providerId: Sequelize.STRING,
    transactionDate: Sequelize.DATE,
    accountNo: Sequelize.STRING,
    amountInINR: {
        type: Sequelize.DECIMAL(12, 4),
        defaultValue: 0.0
    },
    baseAmount: {
        type: Sequelize.DECIMAL(12, 4),
        defaultValue: 0.0
    },
    paymentMode: {
        type: Sequelize.STRING,
        allowNull: true
    },
    orderResponse: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    paymentModeResponse: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    // The instrument used at the gateway (UPI / Credit Card / ...). paymentMode above
    // only records the funding split, so the admin transaction report reads this.
    paymentInstrument: {
        type: Sequelize.STRING(64),
        allowNull: true
    },
    surcharge: Sequelize.DECIMAL(12, 4),
    baseCurrency: Sequelize.STRING,
    exchangeRate: Sequelize.STRING,
    status: Sequelize.STRING,
    message: Sequelize.STRING,
    ecomOrderStatus: {
        type: Sequelize.STRING,
        // default:'PENDING'
    },
    workspaceOrderStatus: {
        type: Sequelize.STRING,
        default: 'PENDING'
    },
    shipmentStatus: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: []
    },
    batchId: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    invoiceId: {
        type: Sequelize.STRING,
        allowNull: true
    },
    journalData: {
        type: Sequelize.JSON,
        defaultValue: null,
    },
    journalRecordStatus: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null,
    },
    pekoInvoiceDetails: {
        type: Sequelize.JSON,
        defaultValue: null,
    },
    optional: Sequelize.STRING,
    couponCodeId: {
        type: Sequelize.BIGINT,
        allowNull: true,
    },
})
// Every writer already persists the raw gateway payload, so derive the instrument here
// rather than at each of the dozen-odd order creation sites.
orders.addHook('beforeCreate', (instance) => {
    if (instance.paymentInstrument) return
    try {
        const instrument = derivePaymentInstrument(instance.paymentModeResponse, instance.paymentMode)
        if (instrument) instance.paymentInstrument = instrument
    } catch (_) {
        // A report column must never be able to fail an order the customer has paid for.
    }
})

orders.belongsTo(serviceOperator)
orders.belongsTo(credential)
orders.belongsTo(SubCorporateUser)
orders.belongsTo(userCoupons, { foreignKey: 'userCouponId', as: 'couponData' })
orders.belongsTo(couponCode, { foreignKey: "couponCodeId", as: 'couponCodeData' });

module.exports = orders