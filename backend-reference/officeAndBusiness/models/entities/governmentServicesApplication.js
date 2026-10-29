'use strict';

// Read-only mirror of purchase/models/entities/governmentServicesApplication.js —
// same physical database/table (governmentServicesApplications), just defined here
// too so officeAndBusiness's shared callRm can resolve the applicant's phoneNumber
// and vendorEngagementId without a cross-service call. officeAndBusiness never
// writes to this table — all mutations stay in purchase.

const Sequelize = require('sequelize');

const sequelizeConfig = require('../../configs/database/index');
const credential = require('./credential');

const governmentServicesApplication = sequelizeConfig.define('governmentServicesApplication', {
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    applicationId: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    vendorCatalogId: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    serviceId: {
        type: Sequelize.INTEGER,
        allowNull: true,
    },
    legalBusinessName: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    pan: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    phoneNumber: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    stateOfRegistration: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
    },
    status: {
        type: Sequelize.ENUM('DRAFT', 'SUBMITTED', 'COMPLETED'),
        defaultValue: 'DRAFT',
    },
    paymentStatus: {
        type: Sequelize.ENUM('PENDING', 'COMPLETED', 'FAILED'),
        defaultValue: 'PENDING',
    },
    vendorGid: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    vendorEngagementId: {
        type: Sequelize.STRING,
        allowNull: true,
    },
}, {
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
});

governmentServicesApplication.belongsTo(credential);

module.exports = governmentServicesApplication;
