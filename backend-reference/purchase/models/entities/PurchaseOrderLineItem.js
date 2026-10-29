'use strict';
const Sequelize       = require('sequelize');
const sequelizeConfig = require('../../configs/database/index');

const PurchaseOrderLineItem = sequelizeConfig.define(
  'purchaseOrderLineItem',
  {
    id: {
      type: Sequelize.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    purchaseOrderId: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
    },
    proposalLineItemId: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
    },
    description: {
      type: Sequelize.STRING(500),
      allowNull: false,
    },
    qty: {
      type: Sequelize.DECIMAL(10, 3),
      allowNull: false,
      defaultValue: 1,
    },
    unit: {
      type: Sequelize.STRING(50),
      allowNull: true,
    },
    unitPrice: {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: false,
    },
    total: {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: '0.00',
    },
    taxRate: {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: true,
    },
    gstType: {
      type: Sequelize.ENUM('inclusive', 'exclusive'),
      allowNull: true,
    },
    sortOrder: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: 'purchase_order_line_items',
    underscored: false,
    indexes: [
      { fields: ['purchaseOrderId'] },
    ],
  }
);

module.exports = PurchaseOrderLineItem;
