/**
 * Created by Imran Noor
 */
'use strict';
const Sequelize = require('sequelize');
const sequelizeConfig = require("../../configs/database/index");

const Package = sequelizeConfig.define('package', {
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    packageName: Sequelize.STRING,
    aliasName: Sequelize.STRING,
    description: Sequelize.TEXT,
    serviceList: Sequelize.TEXT,
    status: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
    },
    discount: Sequelize.JSON,
    packageType: {
        type: Sequelize.ENUM("INDIVIDUAL", "GROUP")
    },
    packagePrices: Sequelize.JSON,
    accessCode: Sequelize.STRING,
    partnerId: Sequelize.STRING,
    packageLogo: Sequelize.STRING,
    priorityLevel: Sequelize.INTEGER,
    externalId: {
        type: Sequelize.STRING,
        allowNull: true
    },
    type: {
        type: Sequelize.STRING,
        enum: ['1', '2'], // 1 for package and 2 for service packages
        default: '1'
    },
    vendorPlanId: {
        type: Sequelize.STRING,
        allowNull: true
    },
    commissionMode: {
        type: Sequelize.ENUM('MARGIN', 'AGENT_MARKUP', 'PRINCIPAL_MARKUP'),
        defaultValue: 'MARGIN'
    },
    commissionType: {
        type: Sequelize.ENUM('PERCENTAGE', 'FLAT'),
        allowNull: true
    },
    commission: {
        type: Sequelize.DECIMAL(10, 4),
        defaultValue: 0,
        allowNull: true
    },
    fixedCommissionPerTransaction: {
        type: Sequelize.DECIMAL(10, 4),
        defaultValue: 0,
        allowNull: true
    },
    isCommissionInclGST: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: true
    },
    isCommissionConfigured: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    },
    planCommissions: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null
    }
})
module.exports = Package