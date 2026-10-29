'use strict'
const Sequelize = require('sequelize')
const sequelizeConfig = require("../../configs/database/index");

/**
 * One row per product (catalog item) received on the ONDC /on_search callback,
 * denormalized with its transaction context AND its provider/vendor (seller
 * store) details, so the whole catalog can be looked up by transactionId after
 * the asynchronous on_search webhook.
 *
 * Source shape: message.catalog["bpp/providers"][] = a provider (the seller /
 * "vendor"), each with items[]. Every item becomes one row here; the vendor
 * fields are repeated on each of its item rows (denormalized).
 *
 * The columns below match, 1:1, the `item` object the onSearch webhook
 * controller builds (controllers/webhook/ondc.js), so the controller can
 * persist the catalog with a single bulkCreate(products).
 */
const ondcProducts = sequelizeConfig.define('ondcProducts', {
    id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true
    },

    // transaction context
    transactionId: {
        type: Sequelize.STRING,
        allowNull: false
    },

    // seller app (BPP) — part of the product identity (bppUri, ondcVendorId, ondcProductId)
    bppUri: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    bppId: {
        type: Sequelize.STRING,
        allowNull: true
    },

    // vendor / provider (seller store)
    ondcVendorId: {
        type: Sequelize.STRING,
        allowNull: true
    },
    vendorName: {
        type: Sequelize.STRING,
        allowNull: true
    },

    // item (product)
    ondcProductId: {
        type: Sequelize.STRING,
        allowNull: true
    },
    name: {
        type: Sequelize.STRING,
        allowNull: true
    },
    symbol: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    shortDesc: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    longDesc: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    images: {
        type: Sequelize.JSON,
        allowNull: true
    },

    // quantity (quantity.unitized.measure / quantity.available / quantity.maximum / quantity.minimum)
    uom: {
        type: Sequelize.STRING,
        allowNull: true
    },
    measureValue: {
        type: Sequelize.STRING,
        allowNull: true
    },
    availableQuantity: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    maxQuantity: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    // minimum order quantity (quantity.minimum.count)
    minQuantity: {
        type: Sequelize.INTEGER,
        allowNull: true
    },

    // price (price block)
    price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
    },
    maxPrice: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
    },

    // ============================================================
    // item policy fields (@ondc/org/* siblings on the catalog item)
    // ============================================================
    returnable: {
        type: Sequelize.BOOLEAN,
        allowNull: true
    },
    cancellable: {
        type: Sequelize.BOOLEAN,
        allowNull: true
    },
    // ISO-8601 duration, e.g. "P2D"
    returnWindow: {
        type: Sequelize.STRING,
        allowNull: true
    },
    // ISO-8601 duration, e.g. "PT4H"
    timeToShip: {
        type: Sequelize.STRING,
        allowNull: true
    },
    // "@ondc/org/contact_details_consumer_care" — raw "name,email,phone" string
    consumerCare: {
        type: Sequelize.TEXT,
        allowNull: true
    },

    // provider location serving this item (items[].location_id, e.g. "L1").
    // Same id as bpp/providers[].locations[].id — /select needs it both as the
    // order-level provider location and the item-level location_id.
    locationId: {
        type: Sequelize.STRING,
        allowNull: true
    },
    // fulfillment option for this item (items[].fulfillment_id, e.g. "F1")
    fulfillmentId: {
        type: Sequelize.STRING,
        allowNull: true
    },

    // category + free-form tags
    categoryId: {
        type: Sequelize.STRING,
        allowNull: true
    },
    tags: {
        type: Sequelize.JSON,
        allowNull: true
    },

    // delivery cities (context.city) — array of ONDC city codes; a product seen
    // in multiple cities accumulates them here instead of creating new rows.
    city: {
        type: Sequelize.JSON,
        allowNull: true
    },

    // ============================================================
    // office-supply scoping — stamped at webhook time from the
    // user_search_ondc registry row matching this transactionId.
    // ============================================================
    // top-level ondc_category.json category (e.g. "Office Equipment")
    category: {
        type: Sequelize.STRING,
        allowNull: true
    },
    // local buyer-app category (e.g. "Writing Supplies")
    localCategory: {
        type: Sequelize.STRING,
        allowNull: true
    },
    // ONDC domain the search ran in (e.g. "ONDC:RET16")
    ondcDomain: {
        type: Sequelize.STRING,
        allowNull: true
    },
    // marks the origin of this row, e.g. "OFFICE_SUPPLIES"
    source: {
        type: Sequelize.STRING,
        allowNull: true
    },
    // admin-controlled visibility to corporates. Default true = shown. Set false
    // to hide from the buyer catalog (findAllOfficeSupplyProductsAndCount filters
    // on it). NOT a volatile field, so it survives every seller re-ingest.
    visibleOnPeko: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    // ONDC statutory requirement blocks from the catalog item — used for admin
    // product detail (manufacturer, etc.). Refreshed on each re-ingest.
    statutory: {
        type: Sequelize.JSON,
        allowNull: true,
    },
    // Set on catalog_full ingest so a delayed reconcile can drop SKUs this
    // snapshot did not send. Incremental (city "*") callbacks must not stamp it.
    catalogSweepId: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    // ondcSellerCategories row for this item's seller category (from
    // item.category_id). Refreshed on each re-ingest.
    sellerCategoryId: {
        type: Sequelize.BIGINT,
        allowNull: true,
    },
    // Products > Review per-product choice: a Peko subcategory that wins over
    // the seller category's mapping. NOT volatile — survives re-ingest.
    pekoCategoryOverrideId: {
        type: Sequelize.BIGINT,
        allowNull: true,
    },
    // Why the system hides this product, first failing rule
    // (sellerNp | domain | seller | keyword | excluded | unmapped | categoryWord |
    // categoryOff | pending); null = passes. Owned
    // by services/ondcProductVisibility.js, separate from the admin switch
    // visibleOnPeko. hiddenDetail = the domain code / seller key / word.
    hiddenReason: {
        type: Sequelize.STRING(16),
        allowNull: true,
    },
    hiddenDetail: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    // Products > Review per-product listing position; null follows the seller category
    listingPositionOverride: {
        type: Sequelize.STRING(16),
        allowNull: true,
    },
    // storefront sort key, 1 (core) … 4 (low); stamped by services/ondcProductVisibility.js
    listingRank: {
        type: Sequelize.TINYINT,
        allowNull: false,
        defaultValue: 2,
    },
    // Products > Review: set on first ingest, hidden (hiddenReason `pending`)
    // until an admin shows/hides it or first maps its seller category.
    pendingReview: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
})

/**
 * Sequelize sync({force:false}) creates the table if missing but never adds new
 * columns to an existing table. Since this table already exists in deployed
 * environments, we add any missing columns (and indexes) idempotently on boot:
 * describeTable tells us what's already there, and we only addColumn/addIndex
 * for what's missing — so this is safe to run on every start and self-heals.
 */
// NOTE: `city` is intentionally NOT here — its STRING->JSON type change is done
// by a migration (ensureTable only adds missing columns, it never alters types).
const WANTED_COLUMNS = {
    bppId: { type: Sequelize.STRING, allowNull: true },
    category: { type: Sequelize.STRING, allowNull: true },
    localCategory: { type: Sequelize.STRING, allowNull: true },
    ondcDomain: { type: Sequelize.STRING, allowNull: true },
    source: { type: Sequelize.STRING, allowNull: true },
    bppUri: { type: Sequelize.TEXT, allowNull: true },
    minQuantity: { type: Sequelize.INTEGER, allowNull: true },
    returnable: { type: Sequelize.BOOLEAN, allowNull: true },
    cancellable: { type: Sequelize.BOOLEAN, allowNull: true },
    returnWindow: { type: Sequelize.STRING, allowNull: true },
    timeToShip: { type: Sequelize.STRING, allowNull: true },
    consumerCare: { type: Sequelize.TEXT, allowNull: true },
    locationId: { type: Sequelize.STRING, allowNull: true },
    fulfillmentId: { type: Sequelize.STRING, allowNull: true },
    visibleOnPeko: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
    statutory: { type: Sequelize.JSON, allowNull: true },
    catalogSweepId: { type: Sequelize.STRING, allowNull: true },
    sellerCategoryId: { type: Sequelize.BIGINT, allowNull: true },
    pekoCategoryOverrideId: { type: Sequelize.BIGINT, allowNull: true },
    hiddenReason: { type: Sequelize.STRING(16), allowNull: true },
    hiddenDetail: { type: Sequelize.STRING, allowNull: true },
    listingPositionOverride: { type: Sequelize.STRING(16), allowNull: true },
    listingRank: { type: Sequelize.TINYINT, allowNull: false, defaultValue: 2 },
    pendingReview: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
}

const WANTED_INDEXES = [
    { name: 'ondc_products_transaction_id', fields: ['transactionId'] },
    { name: 'ondc_products_product_id', fields: ['ondcProductId'] },
    { name: 'ondc_products_source', fields: ['source'] },
    { name: 'ondc_products_source_product', fields: ['source', 'ondcProductId'] },
    { name: 'ondc_products_vendor_product', fields: ['ondcVendorId', 'ondcProductId'] },
    { name: 'ondc_products_storefront', fields: ['availableQuantity', 'visibleOnPeko', 'category'] },
    { name: 'ondc_products_source_updated', fields: ['source', 'updatedAt'] },
    { name: 'ondc_products_local_category', fields: ['localCategory'] },
    { name: 'ondc_products_catalog_sweep', fields: ['catalogSweepId'] },
    { name: 'ondc_products_seller_category', fields: ['sellerCategoryId'] },
    { name: 'ondc_products_hidden_reason', fields: ['hiddenReason'] },
    { name: 'ondc_products_pending_review', fields: ['pendingReview', 'sellerCategoryId'] },
]

const ensureOndcProductsTable = async () => {
    await ondcProducts.sync({ force: false }) // create table if not exists; never drops
    const qi = ondcProducts.sequelize.getQueryInterface()
    const tableName = ondcProducts.getTableName()

    const describe = await qi.describeTable(tableName)
    for (const [column, definition] of Object.entries(WANTED_COLUMNS)) {
        if (!describe[column]) {
            await qi.addColumn(tableName, column, definition)
        }
    }

    const existing = await qi.showIndex(tableName)
    const existingNames = new Set(existing.map((i) => i.name))
    for (const idx of WANTED_INDEXES) {
        if (!existingNames.has(idx.name)) {
            await qi.addIndex(tableName, idx.fields, { name: idx.name })
        }
    }
}

// Exposed so boot-time work that needs the new columns (seller-category seed)
// can wait for the self-heal.
ondcProducts.ready = ensureOndcProductsTable()
ondcProducts.ready
    .then(() => console.log("ondcProducts table is ready"))
    .catch((error) => console.error("Error preparing ondcProducts table:", error))

module.exports = ondcProducts
