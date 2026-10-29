'use strict';
const Sequelize = require('sequelize');
const sequelizeConfig = require('../../configs/database/index');

const PurchaseRequest = sequelizeConfig.define(
  'purchaseRequest',
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
    refNumber: {
      type: Sequelize.STRING(30),
      allowNull: false,
    },
    requestedBy: {
      type: Sequelize.STRING(255),
      allowNull: false,
    },
    requestedByUserId: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
    },
    department: {
      type: Sequelize.STRING(255),
      allowNull: true,
    },
    category: {
      type: Sequelize.STRING(255),
      allowNull: true,
    },
    estimatedBudget: {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: true,
    },
    currency: {
      type: Sequelize.STRING(10),
      allowNull: false,
      defaultValue: 'INR',
    },
    neededBy: {
      type: Sequelize.DATEONLY,
      allowNull: true,
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    lineItems: {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: null,
    },
    attachments: {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: [],
    },
    notes: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    status: {
      type: Sequelize.ENUM('Draft', 'Open', 'Converted to RFQ', 'Converted to PO', 'Cancelled'),
      allowNull: false,
      defaultValue: 'Draft',
    },
    rfqId: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
    },
    submittedAt: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    approvedAt: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    approvedBy: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
    },
    rejectedAt: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    rejectedBy: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
    },
    rejectionReason: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'purchase_requests',
    paranoid: true,
    underscored: false,
  }
);

module.exports = PurchaseRequest;
