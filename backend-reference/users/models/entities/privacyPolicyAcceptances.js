'use strict';
const Sequelize = require('sequelize');
const sequelizeConfig = require('../../configs/database/index');
const Credential = require('./credential');
const PrivacyPolicyDetails = require('./privacyPolicyDetails');

const privacyPolicyAcceptances = sequelizeConfig.define(
  'privacyPolicyAcceptances',
  {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },

    credentialId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'credentials', key: 'id' },
    },

    acceptedAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    },

    ipAddress: {
      type: Sequelize.STRING(50),
      allowNull: true,
    },

    deviceDetails: {
      type: Sequelize.TEXT,
      allowNull: true,
    },

    authorizedSignatoryName: {
      type: Sequelize.STRING,
      allowNull: true,
    },

    authorizedSignatoryRole: {
      type: Sequelize.STRING,
      allowNull: true,
    },

    privacyPolicyId: {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: { model: 'privacy_policy_details', key: 'id' },
    },

    isAccepted: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
);

privacyPolicyAcceptances.belongsTo(Credential, { foreignKey: 'credentialId' });
privacyPolicyAcceptances.belongsTo(PrivacyPolicyDetails, { foreignKey: 'privacyPolicyId' });

module.exports = privacyPolicyAcceptances;
