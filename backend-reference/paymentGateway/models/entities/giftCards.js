"use strict";
const Sequelize = require("sequelize");
const sequelize = require("../../configs/database/index");
const serviceOperators = require("./serviceOperator");

const giftCards = sequelize.define("giftCards", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    product_id: Sequelize.STRING,
    product_name: Sequelize.STRING,
    merchant_id: Sequelize.STRING,
    merchant_name: Sequelize.STRING,
    brand_name: Sequelize.STRING,
    brand_logo: Sequelize.TEXT,
    image: Sequelize.TEXT,
    description: Sequelize.TEXT,
    min_price: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
    },
    priceType: {
        type: Sequelize.ENUM('FIXED', 'FLEXI'),
    },
    max_price: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
    },
    denominations: {
        type: Sequelize.JSON,
        defaultValue: [],
    },
    expiry: Sequelize.DATE,
    is_open_denominnation: Sequelize.BOOLEAN,
    gv_type: {
        type: Sequelize.ENUM('ONLINE', 'OFFLINE', 'OMNI-CHANNEL'),
    },
    terms_and_condition: Sequelize.TEXT,
    how_to_redeem: Sequelize.TEXT,
    status: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
    },
    isAccessible: { 
        type: Sequelize.BOOLEAN,
        defaultValue: true
    },
    sold_quantity: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
    quantityLimit: {
        type: Sequelize.INTEGER,
        defaultValue: null,
        allowNull: true
    },
    expiryAndValidity: {
        type: Sequelize.TEXT,
        defaultValue: null,
        allowNull: true
    },
    commissionMode: {
        type: Sequelize.ENUM('MARGIN', 'AGENT_MARKUP', 'PRINCIPAL_MARKUP'),
        defaultValue: 'MARGIN'
    },
    commissionType: {
        type: Sequelize.ENUM('PERCENTAGE', 'FLAT'),
        defaultValue: 'PERCENTAGE'
    },
    commission: {
        type: Sequelize.DECIMAL(10, 4),
        defaultValue: 0
    },
    fixedCommissionPerTransaction: {
        type: Sequelize.DECIMAL(10, 4),
        defaultValue: 0
    },
    isCommissionInclGST: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
    },
    isCommissionConfigured: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    }
});
giftCards.belongsTo(serviceOperators);
module.exports = giftCards;