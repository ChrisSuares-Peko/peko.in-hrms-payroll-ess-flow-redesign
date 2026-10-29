const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const credential = require("./credential");

const oauth_consents = sequelizeConfig.define("oauth_consents", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  client_id: {
    type: Sequelize.STRING,
  },
  scopes: {
    type: Sequelize.JSON,
    defaultValue: [],
  },
});
oauth_consents.belongsTo(credential);

module.exports = oauth_consents;
