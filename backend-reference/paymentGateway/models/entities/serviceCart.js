'use strict';
const Sequelize = require('sequelize');
const sequelizeConfig = require('../../configs/database/index');

const ServiceCart = sequelizeConfig.define('serviceCart', {
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    itemType: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'domainAndHosting'
    },
    productDetails: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: '[]'
    },
    corporateUserId: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    subCorporateUserId: {
        type: Sequelize.BIGINT,
        allowNull: true
    }
});

module.exports = ServiceCart;
