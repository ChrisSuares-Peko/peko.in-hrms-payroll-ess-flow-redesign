'use strict';
const Sequelize = require('sequelize');
const sequelizeConfig = require('../../configs/database/index');

const RFQVendorInvite = sequelizeConfig.define(
  'rfq_vendor_invites',
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
    externalEmail: {
      type: Sequelize.STRING(255),
      allowNull: true,
    },
    vendorId: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
    },
    invitedAt: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    status: {
      type: Sequelize.ENUM('Draft', 'Invited', 'Declined', 'Submitted'),
      defaultValue: 'Invited',
      allowNull: false,
    },
    vendorToken: {
      type: Sequelize.STRING(64),
      allowNull: true,
    },
    tokenExpiresAt: {
      type: Sequelize.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'rfq_vendor_invites',
    underscored: false,
  }
);

const ProcureVendor = require('./ProcureVendor');

RFQVendorInvite.belongsTo(ProcureVendor, { foreignKey: 'vendorId', as: 'vendor' });

module.exports = RFQVendorInvite;
