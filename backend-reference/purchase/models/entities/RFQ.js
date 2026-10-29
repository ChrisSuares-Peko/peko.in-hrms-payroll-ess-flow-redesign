'use strict';
const Sequelize = require('sequelize');
const sequelizeConfig = require('../../configs/database/index');
const PurchaseRequest = require('./PurchaseRequest');
const RFQLineItem = require('./RFQLineItem');
const RFQVendorInvite = require('./RFQVendorInvite');
const Proposal = require('./Proposal');
 
const RFQ = sequelizeConfig.define(
  'rfqs',
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
    title: {
      type: Sequelize.STRING(255),
      allowNull: false,
    },
    type: {
      type: Sequelize.ENUM('RFQ', 'RFP', 'RFI'),
      defaultValue: 'RFQ',
      allowNull: false,
    },
    submissionDeadline: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    status: {
      type: Sequelize.ENUM('Draft', 'Active', 'Closed'),
      defaultValue: 'Draft',
      allowNull: false,
    },
    termsAndConditions: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    buyerNotes: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    attachments: {
      type: Sequelize.JSON,
      defaultValue: [],
    },
    estimatedTotal: {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: true,
    },
    purchaseRequestId: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
    },
    sentAt: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    closedAt: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    awardedAt: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    reminderSentAt: {
      type: Sequelize.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'rfqs',
    paranoid: true,
    underscored: false,
  }
);

RFQ.belongsTo(PurchaseRequest, { foreignKey: 'purchaseRequestId', as: 'purchaseRequest' });
RFQ.hasMany(RFQLineItem,       { foreignKey: 'rfqId', as: 'lineItems',     onDelete: 'CASCADE' });
RFQ.hasMany(RFQVendorInvite,      { foreignKey: 'rfqId', as: 'vendorInvites', onDelete: 'CASCADE' });
RFQVendorInvite.belongsTo(RFQ,   { foreignKey: 'rfqId', as: 'rfq' });
RFQ.hasMany(Proposal,          { foreignKey: 'rfqId', as: 'proposals' });
Proposal.belongsTo(RFQ,        { foreignKey: 'rfqId', as: 'rfq' });
 
module.exports = RFQ;
