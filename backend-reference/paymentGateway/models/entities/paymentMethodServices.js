const Sequelize = require('sequelize');
const sequelizeConfig = require("../../configs/database/index");
const serviceOperator = require("./serviceOperator")

const PaymentMethodServices = sequelizeConfig.define('payment_methods_services', {
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    isAvailable: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
});

PaymentMethodServices.belongsTo(serviceOperator);

module.exports = PaymentMethodServices