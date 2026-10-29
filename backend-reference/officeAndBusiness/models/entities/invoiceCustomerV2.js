'use strict';
const Sequelize = require('sequelize');
const sequelizeConfig = require("../../configs/database/index");
const corporateUser = require("./corporateUser");

const invoiceCustomerV2 = sequelizeConfig.define('invoiceCustomerV2', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },

  // Basic Information
  name: {
    type: Sequelize.STRING,
    allowNull: true
  },
  personOfContact: {
    type: Sequelize.STRING,
    allowNull: true
  },
  gstin: {
    type: Sequelize.STRING(15),
    allowNull: true
  },
  phoneNumber: {
    type: Sequelize.STRING(15),
    allowNull: false
  },
  email: {
    type: Sequelize.STRING,
    allowNull: true
  },
  upiId: {
    type: Sequelize.STRING,
    allowNull: true
  },
  notes: {
    type: Sequelize.TEXT,
    allowNull: true
  },

  // Invoices for this customer auto-fill their currency from here
  currency: {
    type: Sequelize.STRING(3),
    allowNull: false,
    defaultValue: 'INR'
  },

  // Primary Address
  primaryAddress: {
    type: Sequelize.STRING,
    allowNull: false
  },
  primaryCity: {
    type: Sequelize.STRING,
    allowNull: true
  },
  primaryState: {
    type: Sequelize.STRING,
    allowNull: true
  },
  primaryPincode: {
    type: Sequelize.STRING(10),
    allowNull: true
  },
  primaryCountry: {
    type: Sequelize.STRING,
    allowNull: true,
    defaultValue: 'India'
  },

  // Shipping Address
  shippingAddress: {
    type: Sequelize.STRING,
    allowNull: true
  },
  shippingCity: {
    type: Sequelize.STRING,
    allowNull: true
  },
  shippingState: {
    type: Sequelize.STRING,
    allowNull: true
  },
  shippingPincode: {
    type: Sequelize.STRING(10),
    allowNull: true
  },
  shippingCountry: {
    type: Sequelize.STRING,
    allowNull: true,
    defaultValue: 'India'
  },

  // Bank Details (array of bank accounts)
  // Each object: { accountHolderName, accountNumber, ifscCode, swiftCode, iban }
  bankDetails: {
    type: Sequelize.JSON,
    allowNull: true,
    defaultValue: []
  },

  corporateUserId: {
    type: Sequelize.INTEGER,
    allowNull: false
  },

  status: {
    type: Sequelize.ENUM('ACTIVE', 'INACTIVE'),
    defaultValue: 'ACTIVE',
    allowNull: false,
  },
});

invoiceCustomerV2.belongsTo(corporateUser);

module.exports = invoiceCustomerV2;
