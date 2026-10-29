const Sequelize = require('sequelize');
const sequelizeConfig = require('../../configs/database/index');
const Package = require('./package');
const ServiceOperator = require('./serviceOperator');

const couponCode = sequelizeConfig.define('couponCode', {
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    couponCode: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
    },
    discountType: {
        type: Sequelize.ENUM('FLAT', 'PERCENTAGE'),
        defaultValue: 'PERCENTAGE',
    },
    discount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
    },
    validFrom: {
        type: Sequelize.DATE,
        allowNull: false,
    },
    validTo: {
        type: Sequelize.DATE,
        allowNull: false,
    },
    status: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
    },
    partnerId: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    usageCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
    billingType: {
        type: Sequelize.ENUM('MONTHLY', 'ANNUALLY'),
        allowNull: true,
    },
    couponType: {
        type: Sequelize.ENUM('SUBSCRIPTION', 'SERVICES'),
        allowNull: false,
    },
    minimumPurchase: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
    },
    maximumDiscount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
    },
});

couponCode.belongsTo(Package);
couponCode.belongsTo(ServiceOperator);

module.exports = couponCode;
