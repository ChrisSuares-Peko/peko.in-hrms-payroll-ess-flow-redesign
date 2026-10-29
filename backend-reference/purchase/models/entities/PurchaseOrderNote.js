'use strict';
const Sequelize       = require('sequelize');
const sequelizeConfig = require('../../configs/database/index');

const PurchaseOrderNote = sequelizeConfig.define(
  'purchaseOrderNote',
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
    corporateUserId: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
    },
    note: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
  },
  {
    tableName: 'purchase_order_notes',
    underscored: false,
    updatedAt: false,
    indexes: [
      { fields: ['purchaseOrderId'] },
    ],
  }
);

module.exports = PurchaseOrderNote;
