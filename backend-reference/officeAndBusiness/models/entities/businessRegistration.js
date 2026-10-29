'use strict';

const Sequelize = require('sequelize');

const sequelizeConfig = require('../../configs/database/index');
const corporateUser = require('./corporateUser');
const credential = require('./credential');

// Business Registration application submitted by a corporate (Proprietorship,
// Partnership, OPC, Private Limited, LLP). The full form payload is kept in
// applicationData (JSON) since the shape varies per entity and the vendor API is
// not finalised yet; the extracted columns exist for admin listing/filtering and
// payment tracking. Vendor fields are placeholders for the future integration.
const businessRegistration = sequelizeConfig.define('businessRegistration', {
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
    // Complete form payload captured at final submit (all steps).
    applicationData: {
        type: Sequelize.JSON,
        allowNull: false,
    },
    // Summary fields extracted from applicationData for listing/search.
    businessName: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    contactPerson: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    contactEmail: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    contactMobile: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    incorporationFee: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
    },
    gstAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
    },
    totalAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
    },
    // PENDING = draft created at "Proceed to payment" (payment may already be
    // COMPLETED); flips to SUBMITTED on the final "File Smart Form" submit.
    status: {
        type: Sequelize.ENUM('PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'),
        defaultValue: 'PENDING',
    },
    // When the final submit happened — createdAt is the DRAFT creation date
    // (payment day), so tracking's "Submitted on" needs its own stamp.
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
    paymentId: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    paidAt: {
        type: Sequelize.DATE,
        allowNull: true,
    },
    // Vendor (IndiaFilings) integration — populated by the create-chain (v1.1 doc).
    // Column names mirror companyIncorporation's vendor block.
    vendorStatus: {
        type: Sequelize.ENUM('NOT_SENT', 'SENDING', 'SENT', 'FAILED'),
        defaultValue: 'NOT_SENT',
    },
    vendorLeadId: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    // Global ID (gid) of the vendor customer account — all account-scoped calls
    // (add-startup, people, payment, engagements) hang off this.
    vendorGid: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    vendorApplicationId: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    vendorEngagementId: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    // [{ key, role, index, peopleId, name }] — key = PAN when present, else role:index.
    vendorPeople: {
        type: Sequelize.JSON,
        allowNull: true,
    },
    // [{ key, shareholdingId, shares, name }]
    vendorShareholdings: {
        type: Sequelize.JSON,
        allowNull: true,
    },
    // { [stage]: { status: 'done'|'failed'|'skipped', at, error?, meta? } }
    vendorStages: {
        type: Sequelize.JSON,
        allowNull: true,
    },
    vendorError: {
        type: Sequelize.TEXT,
        allowNull: true,
    },
    vendorAttempts: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
    },
    vendorSentAt: {
        type: Sequelize.DATE,
        allowNull: true,
    },
    srn: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    // Uploaded KYC documents: [{ docType, personKey?, fileName, fileString(base64)
    // — replaced by vendor refs after the chain uploads them }]
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
    // True once the RM feedback is submitted — gates the FE feedback modal.
    feedbackGiven: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
}, {
    // Pin the charset — see businessRegistrationCatalog: legacy server-default
    // charsets (staging = armscii8) can't store utf8mb4 vendor/user strings.
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
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

businessRegistration.belongsTo(credential);
businessRegistration.belongsTo(corporateUser, { foreignKey: 'corporateId' });

module.exports = businessRegistration;
