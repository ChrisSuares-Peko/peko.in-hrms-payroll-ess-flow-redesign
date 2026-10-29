const Sequelize = require("sequelize");
const sequelize = require("../../configs/database/index");
const credential = require("./credential")

const PaytmBpos = sequelize.define("paytmBpos", {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  storeName: {
    type: Sequelize.STRING,
    allowNull: false
  },
  businessCategory: Sequelize.STRING,
  contactPerson: {
    type: Sequelize.STRING,
    allowNull: false
  },
  mobileNumber: {
    type: Sequelize.STRING,
    allowNull: false
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false
  },
  city: Sequelize.STRING,
  preferredLanguage: Sequelize.STRING,
  status: {
    type: Sequelize.ENUM('Customer Contacted','Product Demo Done', 'Payment Received','Setup Completed'),
    defaultValue: 'Customer Contacted'
  },
});
PaytmBpos.belongsTo(credential); 

module.exports = PaytmBpos;
