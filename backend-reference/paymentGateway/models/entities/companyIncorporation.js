'use strict';

const Sequelize = require('sequelize');

const sequelizeConfig = require('../../configs/database/index');

const companyIncorporation = sequelizeConfig.define('companyIncorporation', {
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    applicationId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
    },
    entityType: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    applicantDetails: {
        type: Sequelize.JSON,
        allowNull: false,
    },
    proposedNames: {
        type: Sequelize.JSON,
        allowNull: false,
    },
    registeredOffice: {
        type: Sequelize.JSON,
        allowNull: false,
    },
    directors: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: [],
    },
    additionalShareholders: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: [],
    },
    llpNicCodes: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    llpTotalCapital: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    capital: {
        type: Sequelize.JSON,
        allowNull: true,
    },
    businessActivity: {
        type: Sequelize.JSON,
        allowNull: false,
    },
    moaAoa: {
        type: Sequelize.JSON,
        allowNull: true,
    },
    llpAgreement: {
        type: Sequelize.JSON,
        allowNull: true,
    },
    selectedServices: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: [],
    },
    documents: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: [],
    },
    incorporationFee: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 10000,
    },
    additionalServicesFee: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
    },
    totalAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 10000,
    },
    status: {
        type: Sequelize.ENUM('PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'),
        defaultValue: 'PENDING',
    },
    paymentStatus: {
        type: Sequelize.ENUM('PENDING', 'COMPLETED', 'FAILED'),
        defaultValue: 'PENDING',
    },
    corporateTxnId: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    rejectionReason: {
        type: Sequelize.TEXT,
        allowNull: true,
    },
    notes: {
        type: Sequelize.TEXT,
        allowNull: true,
    },
    approvedAt: {
        type: Sequelize.DATE,
        allowNull: true,
    },
    vendorStatus: {
        type: Sequelize.ENUM('NOT_SENT', 'SENDING', 'SENT', 'FAILED'),
        defaultValue: 'NOT_SENT',
    },
    vendorSentAt: {
        type: Sequelize.DATE,
        allowNull: true,
    },
    vendorAttempts: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
    },
    vendorError: {
        type: Sequelize.TEXT,
        allowNull: true,
    },
    vendorApplicationId: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    vendorTrackingId: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    vendorSetupId: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    vendorStages: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null,
    },
}, {
    indexes: [
        {
            fields: ['credentialId', 'corporateId', 'status'],
        },
        {
            unique: true,
            fields: ['applicationId'],
        },
    ],
});

module.exports = companyIncorporation;
