'use strict';

const Sequelize = require('sequelize');
const sequelizeConfig = require('../../configs/database/index');

const legalTemplate = sequelizeConfig.define('legalTemplates', {
    id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
    },
    title: Sequelize.STRING,
    category: Sequelize.STRING,
    description: Sequelize.TEXT,
    timeEstimate: Sequelize.STRING,
    iconKey: Sequelize.STRING,
    documentUrl: Sequelize.STRING,
    isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
    },
});

module.exports = legalTemplate;
