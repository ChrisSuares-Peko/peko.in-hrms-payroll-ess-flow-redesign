"use strict";
const Sequelize = require("sequelize");
const sequelize = require("../../configs/database/index");
const vendor = require("./vendor");
const credential = require("./credential");

const works = sequelize.define("works", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: Sequelize.STRING,
  features: Sequelize.TEXT,
  description: Sequelize.TEXT,
  image: Sequelize.STRING,
  portfolioType: {
    type: Sequelize.ENUM("TEXT", "IMAGE"),
    defaultValue: "IMAGE",
  },
  portfolio: {
    type: Sequelize.JSON,
    allowNull: true,
    defaultValue: []
  },
  status: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
  },
  contactName: Sequelize.TEXT,
  contactEmail: Sequelize.TEXT,
  contactMobile: Sequelize.TEXT,
});

works.belongsTo(vendor)
works.belongsTo(credential)
module.exports = works;