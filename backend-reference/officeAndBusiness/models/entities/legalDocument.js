'use strict';

const Sequelize = require('sequelize');
const sequelizeConfig = require('../../configs/database/index');
const corporateUser = require('./corporateUser');
const SubCorporateUser = require('./subCorporateUsers');
const eSign = require('./eSign');

const legalDocument = sequelizeConfig.define('legalDocuments', {
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    title: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    status: {
        type: Sequelize.ENUM('DRAFT', 'SENT', 'SIGNED'),
        defaultValue: 'DRAFT',
    },
    editorHtml: {
        type: Sequelize.TEXT('long'),
        allowNull: true,
        defaultValue: null,
    },
    documentUrl: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
    },
    eSignId: {
        type: Sequelize.BIGINT,
        allowNull: true,
        defaultValue: null,
    },
});

legalDocument.belongsTo(corporateUser);
legalDocument.belongsTo(SubCorporateUser);
legalDocument.belongsTo(eSign, { foreignKey: 'eSignId', as: 'eSign' });

module.exports = legalDocument;
