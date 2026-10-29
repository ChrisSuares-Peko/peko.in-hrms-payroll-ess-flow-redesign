"use strict";
const Sequelize = require("sequelize");
const sequelize = require("../../configs/database/index");
const vendor = require("./vendor");

const softwares_subscriptions = sequelize.define("softwares_subscriptions", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: Sequelize.STRING,
  type: Sequelize.STRING, //Email/ Domain
  offersText: Sequelize.STRING,
  image: Sequelize.STRING, //image link
  sendVendorMail: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
  },
  pekoEmail: {
    type: Sequelize.JSON,
    allowNull: true,
    defaultValue: [],
  },
  sendInternalMail: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
  },
  status: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
  },
  peko_key: Sequelize.STRING,
  sold_quantity: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
  },
  displayOrder: {
    type: Sequelize.INTEGER,
    defaultValue: 1,
  },
});

softwares_subscriptions.belongsTo(vendor);
module.exports = softwares_subscriptions;
