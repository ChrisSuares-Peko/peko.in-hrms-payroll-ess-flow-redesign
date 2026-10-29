'use strict';

const Sequelize = require('sequelize');

const sequelizeConfig = require('../../configs/database/index');

// Government Services catalog table for the admin manage-section sync — separate
// from govtServices (old manual-entry list) and govtServiceCatalog (read-only
// mirror used by the corporate Trademark flow). Vendor fields refresh on sync;
// amount/sortOrder are admin-owned and preserved across syncs. status is
// vendor-driven (enabled iff the vendor currently sends the item) unless
// adminLocked is set, which pins it disabled regardless of the vendor feed.
const govtServicesCatalog = sequelizeConfig.define('govtServicesCatalog', {
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    vendorCatalogId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
    },
    bid: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    serviceId: {
        type: Sequelize.INTEGER,
        allowNull: true,
    },
    type: {
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
    price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
    },
    currency: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'INR',
    },
    paymentType: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    about: {
        type: Sequelize.TEXT,
        allowNull: true,
    },
    amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
    },
    status: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
    },
    // Set when an admin explicitly disables a row — sync skips force-enabling a locked row even
    // though the vendor keeps sending it. Cleared when an admin re-enables it.
    adminLocked: {
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
    tableName: 'govtServicesCatalogs',
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    indexes: [
        { unique: true, fields: ['vendorCatalogId'] },
        { fields: ['serviceId'] },
    ],
});

module.exports = govtServicesCatalog;
