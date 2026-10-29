const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");

const oauth_clients = sequelizeConfig.define("oauth_clients", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  client_name: {
    type: Sequelize.STRING,
  },
  client_id: {
    type: Sequelize.STRING,
  },
  client_secret: {
    type: Sequelize.STRING,
  },
  logo_uri: {
    type: Sequelize.STRING,
  },
  frontend_url: {
    type: Sequelize.STRING,
    allowNull: true,
    defaultValue: null,
  },
  redirect_uris: {
    type: Sequelize.JSON,
    allowNull: true,
    defaultValue: [],
  },
  active: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
  },
});

module.exports = oauth_clients;
