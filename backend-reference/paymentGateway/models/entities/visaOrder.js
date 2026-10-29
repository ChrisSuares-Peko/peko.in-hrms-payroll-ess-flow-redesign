const Sequelize = require('sequelize');
const sequelizeConfig = require('../../configs/database/index');
const credential = require('./credential');
const serviceOperator = require('./serviceOperator');

const visaOrders = sequelizeConfig.define('visaOrders', {
    id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
    },
    orderNumber: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
    },
    corporateTxnId: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
    },
    productId: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    productName: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    amountInINR: {
        type: Sequelize.DECIMAL(12, 4),
        defaultValue: 0.0,
    },
    baseCurrency: {
        type: Sequelize.STRING,
        defaultValue: 'INR',
    },
    adult: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
    },
    child: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
    },
    infant: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
    },
    travelDate: {
        type: Sequelize.DATEONLY,
        allowNull: true,
    },
    applicants: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: [],
    },
    orderResponse: {
        type: Sequelize.TEXT,
        allowNull: true,
    },
    paymentStatus: {
        type: Sequelize.ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED'),
        defaultValue: 'PENDING',
    },
    applicationStatus: {
        type: Sequelize.STRING,
        defaultValue: 'NEW',
    },
    transactionDate: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
    },
    documents: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null,
    },
    currentStage: {
        type: Sequelize.INTEGER,
        allowNull: true,
    },
    stageLabel: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    destination: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    visaFormat: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    visaCategory: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    product_breakup: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null,
    },
    actualAmountPaid: {
        type: Sequelize.DECIMAL(12, 4),
        allowNull: true,
        defaultValue: null,
    },
    visaType: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'visa_type',
    },
    addOns: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null,
        field: 'add_ons',
    },
    statusLog: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null,
        field: 'status_log',
    },
});

visaOrders.belongsTo(credential);
visaOrders.belongsTo(serviceOperator);

module.exports = visaOrders;
