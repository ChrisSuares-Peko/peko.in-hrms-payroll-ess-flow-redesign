const Sequelize = require('sequelize');
const sequelizeConfig = require('../../configs/database/index');

const banner = sequelizeConfig.define('banners', {
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    bannerTitle: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    bannerLink: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    description: {
        type: Sequelize.TEXT,
        allowNull: true,
    },
    highlights: {
        type: Sequelize.TEXT,
        allowNull: true,
    },
    bannerImage: {
        type: Sequelize.TEXT,
        allowNull: true,
    },
    status: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
    },
    deviceType: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    position: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    partnerId: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    buttonText: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    bannerType: {
        type: Sequelize.ENUM("SUBSCRIPTION", "OTHER"),
        defaultValue: "OTHER",
    },
});


module.exports = banner;
