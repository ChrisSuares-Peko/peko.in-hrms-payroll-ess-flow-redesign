'use strict';
const Sequelize = require('sequelize');
const sequelizeConfig = require('../../configs/database/index');

const ProcureVendor         = require('./ProcureVendor');
const PurchaseRequest       = require('./PurchaseRequest');
const Proposal              = require('./Proposal');
const RFQ                   = require('./RFQ');
const PurchaseOrderLineItem = require('./PurchaseOrderLineItem');
const PurchaseOrderNote     = require('./PurchaseOrderNote');
const ProcureInvoice        = require('./ProcureInvoice');

const PurchaseOrder = sequelizeConfig.define(
  'purchaseOrder',
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
      type: Sequelize.STRING(200),
      allowNull: true,
    },
    vendorId: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
    },
    proposalId: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
    },
    rfqId: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
    },
    purchaseRequestId: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
    },
    currency: {
      type: Sequelize.STRING(10),
      allowNull: false,
      defaultValue: 'INR',
    },
    deliveryAddress: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    deliveryDate: {
      type: Sequelize.DATEONLY,
      allowNull: true,
    },
    paymentTerms: {
      type: Sequelize.STRING(100),
      allowNull: true,
    },
    notesToVendor: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    subtotal: {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: '0.00',
    },
    taxAmount: {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: '0.00',
    },
    totalAmount: {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: '0.00',
    },
    status: {
      type: Sequelize.ENUM(
        'Draft',
        'PO Issued',
        'Closed',
        'Cancelled'
      ),
      allowNull: false,
      defaultValue: 'Draft',
    },
    internalNotes: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    sentAt: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    acknowledgedAt: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    inProgressAt: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    completedAt: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    cancelledAt: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    cancelReason: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    cancelledBy: {
      type: Sequelize.STRING(150),
      allowNull: true,
    },
    vendorToken: {
      type: Sequelize.STRING(128),
      allowNull: true,
      unique: true,
    },
  },
  {
    tableName: 'purchase_orders',
    paranoid: true,
    underscored: false,
    indexes: [
      {
        unique: true,
        fields: ['corporateUserId', 'refNumber'],
      },
      {
        fields: ['corporateUserId'],
      },
      {
        fields: ['vendorId'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['createdAt'],
      },
      {
        fields: ['purchaseRequestId'],
      },
    ],
  }
);

PurchaseOrder.belongsTo(ProcureVendor,   { foreignKey: 'vendorId',          as: 'vendor' });
ProcureVendor.hasMany(PurchaseOrder,     { foreignKey: 'vendorId',          as: 'purchaseOrders' });

PurchaseOrder.belongsTo(PurchaseRequest, { foreignKey: 'purchaseRequestId', as: 'purchaseRequest' });
PurchaseRequest.hasMany(PurchaseOrder,   { foreignKey: 'purchaseRequestId', as: 'purchaseOrders' });

PurchaseOrder.belongsTo(Proposal, { foreignKey: 'proposalId', as: 'proposal' });
Proposal.hasOne(PurchaseOrder,    { foreignKey: 'proposalId', as: 'purchaseOrder' });

PurchaseOrder.belongsTo(RFQ, { foreignKey: 'rfqId', as: 'rfq' });
RFQ.hasMany(PurchaseOrder,   { foreignKey: 'rfqId', as: 'purchaseOrders' });
PurchaseOrder.hasMany(PurchaseOrderLineItem,   { foreignKey: 'purchaseOrderId',  as: 'lineItems' });
PurchaseOrderLineItem.belongsTo(PurchaseOrder, { foreignKey: 'purchaseOrderId' });

PurchaseOrder.hasMany(PurchaseOrderNote,   { foreignKey: 'purchaseOrderId', as: 'notes' });
PurchaseOrderNote.belongsTo(PurchaseOrder, { foreignKey: 'purchaseOrderId' });

PurchaseOrder.hasMany(ProcureInvoice,   { foreignKey: 'purchaseOrderId', as: 'invoices' });
ProcureInvoice.belongsTo(PurchaseOrder, { foreignKey: 'purchaseOrderId' });

module.exports = PurchaseOrder;
