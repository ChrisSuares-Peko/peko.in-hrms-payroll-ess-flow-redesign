const Sequelize = require('sequelize');
const sequelizeConfig = require('../../configs/database/index');

const partnerPermission = sequelizeConfig.define('partnerPermission', {
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    registeredBy: {
        type: Sequelize.STRING,
    },
    permissions: Sequelize.JSON,
    status: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
  },
});

module.exports = partnerPermission;
