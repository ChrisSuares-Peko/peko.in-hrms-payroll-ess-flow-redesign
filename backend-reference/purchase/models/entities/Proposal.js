'use strict';
const Sequelize        = require('sequelize');
const sequelizeConfig  = require('../../configs/database/index');
const ProposalLineItem = require('./ProposalLineItem');
const ProcureVendor    = require('./ProcureVendor');
 
const Proposal = sequelizeConfig.define(
  'proposal',
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
    corporateUserId: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
    },
    refNumber: {
      type: Sequelize.STRING(30),
      allowNull: true,
    },
    externalEmail: {
      type: Sequelize.STRING(255),
      allowNull: true,
    },
    vendorId: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
    },
    submissionMode: {
      type: Sequelize.ENUM('Online', 'Offline'),
      allowNull: false,
      defaultValue: 'Online',
    },
    totalAmount: {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: true,
    },
    validUntil: {
      type: Sequelize.DATEONLY,
      allowNull: true,
    },
    paymentTerms: {
      type: Sequelize.STRING(100),
      allowNull: true,
    },
    contactPerson: {
      type: Sequelize.STRING(255),
      allowNull: true,
    },
    contactEmail: {
      type: Sequelize.STRING(255),
      allowNull: true,
    },
    contactMobile: {
      type: Sequelize.STRING(50),
      allowNull: true,
    },
    deliveryTimeline: {
      type: Sequelize.STRING(255),
      allowNull: true,
    },
    warranty: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    coverNote: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    pdfAttachment: {
      type: Sequelize.JSON,
      allowNull: true,
    },
    status: {
      type: Sequelize.ENUM('Under Review', 'Accepted', 'Rejected'),
      allowNull: false,
      defaultValue: 'Under Review',
    },
    submittedAt: {
      type: Sequelize.DATE,
      allowNull: true,
    },
  },
  { tableName: 'proposals', underscored: false }
);

Proposal.hasMany(ProposalLineItem, { foreignKey: 'proposalId', as: 'lineItems' });
Proposal.belongsTo(ProcureVendor,  { foreignKey: 'vendorId',   as: 'vendor' });
 
module.exports = Proposal;
