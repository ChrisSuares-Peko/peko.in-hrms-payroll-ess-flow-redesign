const Sequelize = require('sequelize')
const sequelizeConfig = require("../../configs/database/index");

const peko_connect = sequelizeConfig.define('peko_connect', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  serviceProvider: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true
  },
  tagline: Sequelize.STRING,
  address: Sequelize.STRING,
  category: Sequelize.STRING,
  description: Sequelize.TEXT,
  offerings: Sequelize.TEXT,
  email: Sequelize.STRING,
  website: Sequelize.STRING,
  mobileNo: Sequelize.STRING,
  rewards: Sequelize.STRING,
  logo: Sequelize.TEXT,
  status: {
    type: Sequelize.BOOLEAN,
    defaultValue: true
  },
  services: {
    type: Sequelize.JSON,
    allowNull: true,
    defaultValue: [],
  },
});

module.exports = peko_connect;