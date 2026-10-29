'use strict';

const Sequelize = require('sequelize');
const sequelizeConfig = require('../../configs/database/index');
const corporateUser = require('./corporateUser');
const credential = require('./credential');

const compliance = sequelizeConfig.define('compliance', {
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    complianceId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
    },
    credentialId: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    corporateId: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    title: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    description: {
        type: Sequelize.TEXT,
        allowNull: true,
    },
    complianceType: {
        type: Sequelize.ENUM('MCA', 'GST', 'TDS', 'EPF_ESI', 'INC20A', 'BANK_ACCOUNT', 'PT', 'AUDIT'),
        allowNull: false,
    },
    category: {
        type: Sequelize.ENUM('one-time', 'recurring'),
        allowNull: false,
    },
    section: {
        type: Sequelize.ENUM('tax-financial', 'corporate-governance'),
        allowNull: false,
    },
    status: {
        type: Sequelize.ENUM('pending', 'processing', 'completed'),
        defaultValue: 'pending',
    },
    adminStatus: {
        type: Sequelize.ENUM('pending', 'under_review', 'approved', 'rejected', 'reopened'),
        defaultValue: 'pending',
    },
    dueDate: {
        type: Sequelize.DATE,
        allowNull: true,
    },
    notes: {
        type: Sequelize.TEXT,
        allowNull: true,
    },
    adminRemarks: {
        type: Sequelize.TEXT,
        allowNull: true,
    },
    // Shared company details: name, CIN, PAN, TAN, GSTIN, address, contact person, etc.
    companyInfo: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {},
    },
    // Compliance-type-specific form data: directors, signatories, shareholders, deductees, employees, filing selections, etc.
    formData: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {},
    },
    // Uploaded documents: [{ id, key, name, url, uploadedAt }]
    documents: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: [],
    },
    // Document keys the admin requires to be re-uploaded (e.g. ['financialStatements'])
    rejectedDocumentKeys: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: [],
    },
    // Form field keys the admin requires to be corrected (e.g. ['auditPeriod'])
    rejectedFormFields: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: [],
    },
    // Full audit trail: [{ status, timestamp, remarks, fileName }]
    submissionHistory: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: [],
    },
}, {
    indexes: [
        {
            fields: ['credentialId', 'corporateId', 'adminStatus'],
        },
        {
            unique: true,
            fields: ['complianceId'],
        },
        {
            fields: ['complianceType', 'status'],
        },
        {
            fields: ['corporateId', 'dueDate'],
        },
    ],
});

compliance.belongsTo(credential, { foreignKey: 'credentialId' });
compliance.belongsTo(corporateUser, { foreignKey: 'corporateId' });

module.exports = compliance;
