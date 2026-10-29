/**
 * Created by Bhatt Aasif
 */

"use strict";
const Sequelize = require("sequelize");
const sequelize = require("../../configs/database/index");
const categories = require("./categories");
const Photos = require("./photos");

const products = sequelize.define("products", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  brand: Sequelize.STRING,
  name: Sequelize.STRING,
  description: Sequelize.TEXT,
  highlights: Sequelize.TEXT,
  SKUCode: Sequelize.STRING,
  productImage: Sequelize.STRING,
  price: Sequelize.DECIMAL(10, 2),
  quantity: Sequelize.INTEGER,
  status: {
    type: Sequelize.BOOLEAN,
    defaultValue: true
  },
  discountType: {
    type: Sequelize.ENUM("FLAT", "PERCENTAGE"),
    defaultValue: "PERCENTAGE"
  },
  discount: {
    type: Sequelize.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  actualPrice: Sequelize.DECIMAL(10, 2),
   // vendorPrice: Sequelize.DECIMAL(10, 2),
   GST: {
    type: Sequelize.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  gstType: {
    type: Sequelize.ENUM("CUSTOM", "PERCENTAGE"),
    defaultValue: "PERCENTAGE",
  },
  vendors: {
    type: Sequelize.JSON,
    allowNull: true,
    defaultValue: [],
  },
  warranty: Sequelize.TEXT,
  features: {
    type: Sequelize.JSON,
    allowNull: true,
    defaultValue: [],
  },
});
products.belongsTo(categories)
products.hasMany(Photos)
module.exports = products;