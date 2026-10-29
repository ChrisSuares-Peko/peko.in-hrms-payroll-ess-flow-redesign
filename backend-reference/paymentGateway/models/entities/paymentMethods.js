const Sequelize = require('sequelize');
const sequelizeConfig = require("../../configs/database/index");
const PaymentMethodServices = require("./paymentMethodServices");

const PaymentMethods = sequelizeConfig.define('payment_methods', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  partnerId: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  paymentMethod: {
    type: Sequelize.ENUM('PAYMENT_GATEWAY', 'WALLET', 'CORPORATE_CARD'),
    allowNull: false,
  },
  limits: {
    type: Sequelize.JSON,
    default: {}
  },
  pgProvider: {
    type: Sequelize.STRING(64),
    allowNull: true,
    defaultValue: null,
  },
  isActive: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  }
});

PaymentMethods.hasMany(PaymentMethodServices, {
  foreignKey: "paymentMethodId",
  as: "serviceList" // Use 'serviceList' instead of 'payment_methods_services'
});

module.exports = PaymentMethods