const Sequelize = require('sequelize');
const sequelizeConfig = require("../../configs/database/index");
const package = require("./package")

const subscription_codes = sequelizeConfig.define('subscription_vouchers', {
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    activationCode: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
    },
    billingType: {
        type: Sequelize.STRING,
        allowNull: false
    },
    isUsed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    status: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
    },
    subscriptionPaymentRefId: {
        type: Sequelize.STRING,
        defaultValue: null,
    }
})

subscription_codes.belongsTo(package)

module.exports = subscription_codes