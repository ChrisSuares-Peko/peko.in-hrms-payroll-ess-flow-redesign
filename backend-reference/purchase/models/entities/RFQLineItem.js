'use strict';
const Sequelize = require('sequelize');
const sequelizeConfig = require('../../configs/database/index');

const RFQLineItem = sequelizeConfig.define(
  'rfq_line_items',
  {
    id: {
      type: Sequelize.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    rfqId: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
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
    estUnitCost: {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: true,
    },
    total: {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: true,
    },
    sortOrder: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    },
  },
  {
    tableName: 'rfq_line_items',
    underscored: false,
  }
);

module.exports = RFQLineItem;
