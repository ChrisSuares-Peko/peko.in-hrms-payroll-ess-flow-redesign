'use strict';
const Sequelize       = require('sequelize');
const sequelizeConfig = require('../../configs/database/index');

const ProposalLineItem = sequelizeConfig.define(
  'proposalLineItem',
  {
    id: {
      type: Sequelize.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    proposalId: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
    },
    rfqLineItemId: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
    },
    description: {
      type: Sequelize.STRING(500),
      allowNull: false,
    },
    unitPrice: {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: true,
    },
    qty: {
      type: Sequelize.DECIMAL(10, 3),
      allowNull: true,
    },
    total: {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: true,
    },
    taxRate: {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: true,
    },
    gstType: {
      type: Sequelize.ENUM('inclusive', 'exclusive'),
      allowNull: true,
    },
  },
  { tableName: 'proposal_line_items', underscored: false }
);

module.exports = ProposalLineItem;
