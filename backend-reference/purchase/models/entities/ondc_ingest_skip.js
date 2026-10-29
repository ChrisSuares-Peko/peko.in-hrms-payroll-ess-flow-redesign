'use strict'
const Sequelize = require('sequelize')
const sequelizeConfig = require("../../configs/database/index");

/**
 * Catalog items on_search refused to store, keyed like ondcProducts
 * (bppId + providerId + ondcProductId) and attributed to the FIRST rule that
 * refused them. Products refused by a rule are never stored, so this is what
 * the Rules tab counts ("hiding N products", keyword hit badges, the unmapped
 * banner). Rows not seen for 24 h are pruned — the same horizon as the
 * midnight stale-product purge.
 *
 * reason: domain | seller | keyword | unmapped | noImage
 * ruleKey: domain code | "bppId|providerId" | matched word | seller category label
 */
const ondcIngestSkips = sequelizeConfig.define('ondcIngestSkips', {
    id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true
    },
    bppId: {
        // 191 keeps the composite unique index inside InnoDB's key-length limit
        type: Sequelize.STRING(191),
        allowNull: false
    },
    providerId: {
        type: Sequelize.STRING(191),
        allowNull: false
    },
    ondcProductId: {
        type: Sequelize.STRING(191),
        allowNull: false
    },
    productName: {
        type: Sequelize.STRING(512),
        allowNull: true
    },
    sellerName: {
        type: Sequelize.STRING,
        allowNull: true
    },
    ondcDomain: {
        type: Sequelize.STRING(64),
        allowNull: true
    },
    reason: {
        type: Sequelize.STRING(16),
        allowNull: false
    },
    ruleKey: {
        type: Sequelize.STRING(255),
        allowNull: true
    },
    lastSeenAt: {
        type: Sequelize.DATE,
        allowNull: false
    },
}, {
    indexes: [
        { name: 'ondc_ingest_skips_product', fields: ['bppId', 'providerId', 'ondcProductId'], unique: true },
        { name: 'ondc_ingest_skips_reason', fields: ['reason', 'lastSeenAt'] },
        { name: 'ondc_ingest_skips_seen', fields: ['lastSeenAt'] },
    ],
})

// async so a stubbed sequelize (tests) rejects here instead of throwing on require
const ensureTable = async () => { await ondcIngestSkips.sync({ force: false }) }

ensureTable()
    .then(() => console.log("ondcIngestSkips table is ready"))
    .catch((error) => console.error("Error preparing ondcIngestSkips table:", error))

module.exports = ondcIngestSkips
