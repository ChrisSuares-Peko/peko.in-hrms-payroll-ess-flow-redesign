"use strict";
const Sequelize = require("sequelize");
const sequelize = require("../../configs/database/index");
const categories = require("./categories");
const vendor = require("./vendor");

const softwares = sequelize.define("softwares", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  productId: {
    type: Sequelize.STRING,
    unique: true
  },
  name: Sequelize.STRING,
  description: Sequelize.TEXT,
  discount: Sequelize.STRING,
  features: Sequelize.TEXT,
  image: Sequelize.STRING,
  pekoEmail: {
    type: Sequelize.JSON,
    allowNull: true,
    defaultValue: []
  },
  sendMail: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
  },
  typeOfOrder: {
    type: Sequelize.ENUM("MANUAL", "API"),
    defaultValue: "MANUAL",
  },
  status: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
  },
});

softwares.belongsTo(vendor)
softwares.belongsTo(categories);
module.exports = softwares;