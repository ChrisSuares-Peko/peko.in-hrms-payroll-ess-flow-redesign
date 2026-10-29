'use strict';

const Sequelize = require('sequelize');

const sequelizeConfig = require('../../configs/database/index');

// Business Registration catalog — the vendor (IndiaFilings) catalog persisted on
// our side so admins can layer custom pricing/visibility/order on top. Vendor
// fields are refreshed on sync; the 3 admin fields (amount/status/sortOrder) are
// preserved across syncs. `order` is a reserved word so the column is `sortOrder`.
const businessRegistrationCatalog = sequelizeConfig.define('businessRegistrationCatalog', {
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    // Vendor fields (read-only, refreshed on sync).
    vendorCatalogId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
    },
    serviceId: {
        type: Sequelize.INTEGER,
        allowNull: true,
    },
    serviceName: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    variantName: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    description: {
        type: Sequelize.TEXT,
        allowNull: true,
    },
    vendorPrice: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
    },
    governmentFeeAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
    },
    unit: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    currency: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'INR',
    },
    about: {
        type: Sequelize.TEXT,
        allowNull: true,
    },
    // Full raw vendor row so no field is lost.
    vendorData: {
        type: Sequelize.JSON,
        allowNull: true,
    },
    // Admin custom fields (preserved across vendor sync).
    amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
    },
    // Inactive by default — the admin activates each service manually after
    // reviewing/setting the custom pricing.
    status: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
    },
    sortOrder: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
    },
    commissionMode: {
        type: Sequelize.ENUM('MARGIN', 'AGENT_MARKUP', 'PRINCIPAL_MARKUP'),
        defaultValue: 'MARGIN',
    },
    commissionType: {
        type: Sequelize.ENUM('PERCENTAGE', 'FLAT'),
        defaultValue: 'PERCENTAGE',
    },
    commission: {
        type: Sequelize.DECIMAL(10, 4),
        defaultValue: 0,
    },
    fixedCommissionPerTransaction: {
        type: Sequelize.DECIMAL(10, 4),
        defaultValue: 0,
    },
    isCommissionInclGST: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
    },
    isCommissionConfigured: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    },
}, {
    // Pin the charset — environments whose MySQL DEFAULT charset is a legacy
    // one (staging = armscii8) otherwise create this table unable to store the
    // vendor's utf8mb4 strings ("Conversion from collation utf8mb4_unicode_ci
    // into armscii8_general_ci impossible" on sync).
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    indexes: [
        { unique: true, fields: ['vendorCatalogId'] },
        { fields: ['serviceId'] },
    ],
});

module.exports = businessRegistrationCatalog;
