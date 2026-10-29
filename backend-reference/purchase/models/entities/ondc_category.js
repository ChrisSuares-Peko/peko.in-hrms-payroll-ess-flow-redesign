'use strict'
const Sequelize = require('sequelize')
const sequelizeConfig = require("../../configs/database/index");

/**
 * Admin-managed ONDC office-supply category tree (2 levels: category ->
 * subcategory), powering the Manage > Products > Categories tab. Products
 * match by stamped name (`ondcProducts.category` / `localCategory`) — there
 * is no FK to ondcProducts.
 *
 * Unrelated to models/entities/category.js / categories.js, which are a
 * different, vendor-linked marketplace category table for another domain.
 */
const officeSupplyCategories = sequelizeConfig.define('officeSupplyCategories', {
    id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    // e.g. "RET16" — free text (ondc_category.json itself has messy multi-domain
    // values like "RET16 , RET10"), so this is not an enum.
    ondcDomain: {
        type: Sequelize.STRING,
        allowNull: true
    },
    // subcategories only. Seller categoryId / descriptor tags this row covers
    // (JSON string array, e.g. ["Laptop", "Desktop"]). classifyProductCategory
    // matches seller category labels against this field at ingest.
    keywords: {
        type: Sequelize.JSON,
        allowNull: true
    },
    // self-FK. NULL = top-level category. Non-null = subcategory of that parent.
    // Only 2 levels are ever used, enforced in the use-case layer.
    parentId: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: { model: 'officeSupplyCategories', key: 'id' },
    },
    displayOrder: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    enabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    // Denormalized snapshot, NOT a live count — maintained by
    // refreshCategoryProductCounts (use-cases/ondc_category.js), which the
    // debounced services/ondcCategoryCountRefresher runs off the request path.
    // Counting on read used to dominate the admin categories endpoint.
    productCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    // When productCount was last recomputed — surfaced in the admin UI so a
    // stale snapshot is not mistaken for a live number.
    productCountUpdatedAt: {
        type: Sequelize.DATE,
        allowNull: true
    },
    // Parent categories only — public CDN URL for the corporate category bar chip.
    // Subcategories always null.
    iconUrl: {
        type: Sequelize.STRING,
        allowNull: true,
    },
})

officeSupplyCategories.belongsTo(officeSupplyCategories, { as: 'parent', foreignKey: 'parentId' })

const WANTED_INDEXES = [
    { name: 'office_supply_categories_parent_id', fields: ['parentId'] },
]

// Self-heal every non-PK column: sync({ force: false }) creates the table only
// when absent and never adds columns to an existing one, so a table already
// created elsewhere (another service defining a partial model of this shared
// table, or an older release) leaves the rest missing and every query fails
// with "Unknown column ... in 'field list'". NOT NULL columns need a
// defaultValue here so the backfill of existing rows succeeds. parentId
// intentionally omits its self-FK — the constraint is not worth failing the
// boot-time repair over.
const WANTED_COLUMNS = {
    name: { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
    ondcDomain: { type: Sequelize.STRING, allowNull: true },
    keywords: { type: Sequelize.JSON, allowNull: true },
    parentId: { type: Sequelize.BIGINT, allowNull: true },
    displayOrder: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
    enabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
    productCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
    productCountUpdatedAt: { type: Sequelize.DATE, allowNull: true },
    iconUrl: { type: Sequelize.STRING, allowNull: true },
}

const ensureOfficeSupplyCategoriesTable = async () => {
    await officeSupplyCategories.sync({ force: false }) // create table if not exists; never drops
    const qi = officeSupplyCategories.sequelize.getQueryInterface()
    const tableName = officeSupplyCategories.getTableName()

    const describe = await qi.describeTable(tableName)
    for (const [column, definition] of Object.entries(WANTED_COLUMNS)) {
        if (describe[column]) continue
        // Per-column try/catch so one failure still lets the others through.
        try {
            await qi.addColumn(tableName, column, definition)
            console.log(`officeSupplyCategories: added missing column "${column}"`)
        } catch (error) {
            console.error(`officeSupplyCategories: failed to add column "${column}":`, error?.message)
        }
    }

    const existing = await qi.showIndex(tableName)
    const existingNames = new Set(existing.map((i) => i.name))
    for (const idx of WANTED_INDEXES) {
        if (existingNames.has(idx.name)) continue
        try {
            await qi.addIndex(tableName, idx.fields, { name: idx.name })
        } catch (error) {
            console.error(`officeSupplyCategories: failed to add index "${idx.name}":`, error?.message)
        }
    }
}

ensureOfficeSupplyCategoriesTable()
    .then(() => console.log("officeSupplyCategories table is ready"))
    .catch((error) => console.error("Error preparing officeSupplyCategories table:", error))

module.exports = officeSupplyCategories
