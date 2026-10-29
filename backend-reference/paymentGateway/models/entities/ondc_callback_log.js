"use strict";
/**
 * Read-only mirror of purchase's `ondcCallbackLogs`.
 * Used to load the on_init order for BPP /confirm after payment.
 * Table creation lives in purchase — do not sync from this service.
 */
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");

const ondcCallbackLogs = sequelizeConfig.define(
  "ondcCallbackLogs",
  {
    id: {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    action: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    transactionId: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    messageId: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    bppId: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    bppUri: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    domain: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    hasError: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    error: {
      type: Sequelize.JSON,
      allowNull: true,
    },
    payload: {
      type: Sequelize.JSON,
      allowNull: true,
    },
  }
);

// Do not sync — purchase owns table creation.
module.exports = ondcCallbackLogs;
