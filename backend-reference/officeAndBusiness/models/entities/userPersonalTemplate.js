'use strict';

const Sequelize = require('sequelize');
const sequelizeConfig = require('../../configs/database/index');
const corporateUser = require('./corporateUser');
const SubCorporateUser = require('./subCorporateUsers');

const userPersonalTemplate = sequelizeConfig.define('userPersonalTemplates', {
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    title: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    iconKey: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    category: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    timeEstimate: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    html: {
        type: Sequelize.TEXT('long'),
        allowNull: true,
    },
});

userPersonalTemplate.belongsTo(corporateUser);
userPersonalTemplate.belongsTo(SubCorporateUser);

module.exports = userPersonalTemplate;
