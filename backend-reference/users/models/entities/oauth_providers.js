const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");

const oauth_providers = sequelizeConfig.define("oauth_providers", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  key: {
    type: Sequelize.STRING,
  },
  issuer: {
    type: Sequelize.STRING,
  },
  client_id: {
    type: Sequelize.STRING,
  },
  client_secret: {
    type: Sequelize.STRING,
  },
  redirect_uri: {
    type: Sequelize.STRING,
  },
  scope: {
    type: Sequelize.STRING,
  },
  registeredBy: {
    type: Sequelize.STRING,
    defaultValue: null,
  },
});

module.exports = oauth_providers;
