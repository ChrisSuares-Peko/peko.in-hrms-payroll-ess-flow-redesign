'use strict'

const Sequelize = require('sequelize')

const sequelizeConfig = require('../../configs/database/index')

// Minimal mirror of purchase's `governmentServicesApplications` table — paymentGateway
// shares the DB and only needs to resolve/mark drafts paid. Sync runs with
// { force:false }, no `alter`, so this partial model never creates/alters the table
// (same pattern as businessRegistration.js / govtServiceApplication.js here).
const governmentServicesApplication = sequelizeConfig.define('governmentServicesApplication', {
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    // Not unique/required — mirrors purchase's own entity; Create Business is
    // idempotent per PAN, so this can repeat and stays null on a lead-only draft.
    applicationId: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    vendorCatalogId: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    // Vendor's numeric service_id, resolved by purchase's saveApplicationV2 —
    // how the payment handler below finds the right draft to pay, scoped by credentialId.
    serviceId: {
        type: Sequelize.INTEGER,
        allowNull: true,
    },
    // Full form payload (profile + vendor.applicationId/gid); vendor application
    // id needed for Create Order (doc §19) lives here.
    applicationData: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {},
    },
    credentialId: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    status: {
        type: Sequelize.ENUM('DRAFT', 'SUBMITTED', 'COMPLETED'),
        defaultValue: 'DRAFT',
    },
    submittedAt: {
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
    vendorGid: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    // Create Order's (doc §19) engagement_id (e.g. "E2170086") — set below by
    // markApplicationPaid once payment succeeds.
    vendorEngagementId: {
        type: Sequelize.STRING,
        allowNull: true,
    },
})

module.exports = governmentServicesApplication
