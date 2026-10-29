'use strict';

const Sequelize = require('sequelize');

const sequelizeConfig = require('../../configs/database/index');
const credential = require('./credential');

// Application submitted against the Gov Services catalog (Trademark Registration etc.)
// — full form payload lives in applicationData (JSON), with extracted summary/vendor
// columns for listing and payment tracking. Separate from the old govtServiceApplications table.
const governmentServicesApplication = sequelizeConfig.define('governmentServicesApplication', {
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    // Vendor's own business application_id; null until Create Business by PAN succeeds.
    // Deliberately NOT unique (see migration
    // 20260909000000-drop-unique-applicationId-on-governmentServicesApplications)
    // — Create Business is idempotent per PAN, so this can repeat across separate purchases.
    applicationId: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    // Selected variant's vendor catalog id; also sent as catalog_id on Create Order (doc §19).
    vendorCatalogId: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    // Vendor's numeric service_id; paymentGateway resolves which application to pay
    // by {credentialId, serviceId}, not applicationId.
    serviceId: {
        type: Sequelize.INTEGER,
        allowNull: true,
    },
    // Complete form payload captured at save/submit.
    applicationData: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {},
    },
    // Summary fields extracted from applicationData for listing/search.
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
    // DRAFT = created at "Proceed to payment" (payment may already be
    // COMPLETED); flips to SUBMITTED on the final submit.
    status: {
        type: Sequelize.ENUM('DRAFT', 'SUBMITTED', 'COMPLETED'),
        defaultValue: 'DRAFT',
    },
    submittedAt: {
        type: Sequelize.DATE,
        allowNull: true,
    },
    completedAt: {
        type: Sequelize.DATE,
        allowNull: true,
    },
    paymentStatus: {
        type: Sequelize.ENUM('PENDING', 'COMPLETED', 'FAILED'),
        defaultValue: 'PENDING',
    },
    corporateTxnId: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    paidAt: {
        type: Sequelize.DATE,
        allowNull: true,
    },
    // Vendor (IndiaFilings) integration fields — populated once Business List/
    // Create Business (doc §22/§23) and Create Order (doc §19) run.
    vendorGid: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    // Create Order's (doc §19) engagement_id (e.g. "E2170086"); own column so
    // it's queryable without unpacking JSON.
    vendorEngagementId: {
        type: Sequelize.STRING,
        allowNull: true,
    },

    documents: {
        type: Sequelize.JSON,
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
}, {
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    indexes: [
        { fields: ['credentialId', 'status'] },
        { fields: ['vendorCatalogId'] },
        // Non-unique, for lookup performance only (see applicationId comment above).
        { fields: ['applicationId'] },
    ],
});

governmentServicesApplication.belongsTo(credential);

module.exports = governmentServicesApplication;
