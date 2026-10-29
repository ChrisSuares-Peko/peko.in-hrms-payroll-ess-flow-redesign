"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../../configs/database/index");
const credential = require("../credential");

const garage_document = sequelizeConfig.define("garage_document", {
  id: {
    type: Sequelize.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  type: {
    type: Sequelize.ENUM("Aadhaar", "PAN", "DL", "RC", "Permit", "Insurance", 'PUC', "Fitness", "RoadTax", "Other"),
    allowNull: false,
  },
  fileUrl: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  expiryDate: {
    type: Sequelize.DATE,
    allowNull: true,
  },
  vehicleId: {
    type: Sequelize.BIGINT,
    allowNull: true,
  },
  driverId: {
    type: Sequelize.BIGINT,
    allowNull: true,
  },
  uploadedAt: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW,
  },
});

garage_document.belongsTo(credential)

garage_document.associate = (models) => {
  garage_document.belongsTo(models.garage_fleet, { foreignKey: "vehicleId", as: "vehicle" });
  garage_document.belongsTo(models.garage_driver, { foreignKey: "driverId", as: "driver" });
};

module.exports = garage_document;
