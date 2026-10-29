const Sequelize = require('sequelize');
const sequelizeConfig = require('../../configs/database/index');

const partnerServiceAccess = sequelizeConfig.define('partnerServiceAccess', {
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    partnerId: {
        type: Sequelize.BIGINT,
        allowNull: false,
    },
    permissions: {
        type: Sequelize.JSON,
        allowNull: false,
    },
    status: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
    },
});

module.exports = partnerServiceAccess;
