"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const orders = require("./order");
const corporateUser = require("./corporateUser");

const CorporateSoftwareSubscription = sequelizeConfig.define(
  "corporate_software_subscriptions",
  {
    id: {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    corporateUserId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    orderId: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    planSkuId: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    productName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    webUrl: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    planName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    purchaseType: {
      type: Sequelize.ENUM("one_time", "subscription"),
      allowNull: true,
    },
    subscriptionStartDate: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    subscriptionEndDate: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    billingCycle: {
      type: Sequelize.ENUM("monthly", "yearly", "one_time"),
      allowNull: true,
    },
    subscriptionRenewalDate: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    vendorResponse: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    status: {
      type: Sequelize.ENUM("PENDING", "ACTIVE", "CANCELLED", "EXPIRED", "FAILED"),
      defaultValue: "PENDING",
      allowNull: false,
    },
    isCancelled: {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    },
  },
);

CorporateSoftwareSubscription.belongsTo(corporateUser);

CorporateSoftwareSubscription.belongsTo(orders);

module.exports = CorporateSoftwareSubscription;
