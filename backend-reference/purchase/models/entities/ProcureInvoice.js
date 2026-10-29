'use strict';
const Sequelize = require('sequelize');
const sequelizeConfig = require('../../configs/database/index');

const ProcureInvoice = sequelizeConfig.define(
  'procureInvoice',
  {
    id: {
      type: Sequelize.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    corporateUserId: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
    },
    purchaseOrderId: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
    },
    vendorId: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
    },
    invoiceNumber: {
      type: Sequelize.STRING(100),
      allowNull: true,
    },
    amount: {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: false,
    },
    bankAccountHolder: {
      type: Sequelize.STRING(200),
      allowNull: true,
    },
    bankName: {
      type: Sequelize.STRING(100),
      allowNull: true,
    },
    accountNumber: {
      type: Sequelize.STRING(100),
      allowNull: true,
    },
    ifscCode: {
      type: Sequelize.STRING(100),
      allowNull: true,
    },
    invoiceDate: {
      type: Sequelize.DATEONLY,
      allowNull: true,
    },
    receivedDate: {
      type: Sequelize.DATEONLY,
      allowNull: true,
    },
    dueDate: {
      type: Sequelize.DATEONLY,
      allowNull: true,
    },
    attachments: {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: [],
    },
    notes: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    status: {
      type: Sequelize.ENUM('Pending', 'Verified', 'Approved', 'Rejected', 'Paid'),
      allowNull: false,
      defaultValue: 'Pending',
    },
    paymentStatus: {
      type: Sequelize.ENUM('PENDING', 'PROCESSING', 'PAID', 'FAILED'),
      allowNull: false,
      defaultValue: 'PENDING',
    },
    paymentReferenceId: {
      type: Sequelize.STRING(60),
      allowNull: true,
    },
  },
  {
    tableName: 'procure_invoices',
    paranoid: true,
    underscored: false,
    indexes: [
      { fields: ['corporateUserId'] },
      { fields: ['purchaseOrderId'] },
      { fields: ['status'] },
    ],
  }
);

module.exports = ProcureInvoice;
