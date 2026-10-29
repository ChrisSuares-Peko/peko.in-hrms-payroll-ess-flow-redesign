"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");

const PrivacyPolicyDetails = sequelizeConfig.define("privacy_policy_details", {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },

  privacyPolicyRegistrationText: {
    type: Sequelize.TEXT,
    allowNull: false,
  },
  hyperLinkText: {
    type: Sequelize.TEXT,
    allowNull: true,
  },
  validationText: {
    type: Sequelize.TEXT,
    allowNull: true,
  },
  status: {
    type: Sequelize.ENUM("ACTIVE", "INACTIVE"),
    allowNull: false,
    defaultValue: "ACTIVE",
  },

  effectiveFrom: {
    type: Sequelize.DATE,
    allowNull: true,
  },

  isMandatory: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
});

module.exports = PrivacyPolicyDetails;
