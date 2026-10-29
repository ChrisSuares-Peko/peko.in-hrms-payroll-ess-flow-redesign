'use strict'
const Sequelize = require('sequelize')
const sequelizeConfig = require("../../configs/database/index");

/**
 * One row per seller category — the category a seller sends on each catalog
 * item (`item.category_id`) within an ONDC domain. Manage > Products > Review:
 * an admin maps it to a Peko subcategory, excludes it, or leaves it undecided.
 * Its products are only shown on the storefront once it is mapped (see
 * services/ondcProductVisibility.js).
 *
 * Keyed on the raw category id (normalised), not the descriptor name, so it
 * matches ondcProducts.categoryId. `label` is what admins see: the catalog's
 * descriptor name for that id when the seller sends one, else the id.
 *
 * status: unmapped | mapped | excluded
 */
const ondcSellerCategories = sequelizeConfig.define('ondcSellerCategories', {
    id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true
    },
    ondcDomain: {
        type: Sequelize.STRING(64),
        allowNull: false
    },
    categoryKey: {
        type: Sequelize.STRING(191),
        allowNull: false
    },
    label: {
        type: Sequelize.STRING,
        allowNull: true
    },
    status: {
        type: Sequelize.STRING(16),
        allowNull: false,
        defaultValue: 'unmapped'
    },
    // Peko subcategory (officeSupplyCategories.id) when status = mapped
    pekoCategoryId: {
        type: Sequelize.BIGINT,
        allowNull: true
    },
    // "New" badge on the Review tab; cleared by a decision or "Mark all reviewed"
    isNew: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    firstSeenAt: {
        type: Sequelize.DATE,
        allowNull: true
    },
    lastSeenAt: {
        type: Sequelize.DATE,
        allowNull: true
    },
    decidedAt: {
        type: Sequelize.DATE,
        allowNull: true
    },
    decidedByName: {
        type: Sequelize.STRING,
        allowNull: true
    },
    // storefront listing position: core | useful | accessory | low
    listingPosition: {
        type: Sequelize.STRING(16),
        allowNull: false,
        defaultValue: 'useful'
    },
    // "Hide products containing": normalised words, comma-joined
    hideKeywords: {
        type: Sequelize.TEXT,
        allowNull: true
    },
}, {
    indexes: [
        { name: 'ondc_seller_categories_key', fields: ['ondcDomain', 'categoryKey'], unique: true },
        { name: 'ondc_seller_categories_status', fields: ['status'] },
    ],
})

// async so a stubbed sequelize (tests) rejects here instead of throwing on require.
// sync() never adds columns to an existing table, so add the later ones here.
const ensureTable = async () => {
    await ondcSellerCategories.sync({ force: false })
    const qi = ondcSellerCategories.sequelize.getQueryInterface()
    const table = ondcSellerCategories.getTableName()
    const columns = await qi.describeTable(table)
    if (!columns.listingPosition) await qi.addColumn(table, 'listingPosition', { type: Sequelize.STRING(16), allowNull: false, defaultValue: 'useful' })
    if (!columns.hideKeywords) await qi.addColumn(table, 'hideKeywords', { type: Sequelize.TEXT, allowNull: true })
}

ondcSellerCategories.ready = ensureTable()
ondcSellerCategories.ready
    .then(() => console.log("ondcSellerCategories table is ready"))
    .catch((error) => console.error("Error preparing ondcSellerCategories table:", error))

module.exports = ondcSellerCategories
