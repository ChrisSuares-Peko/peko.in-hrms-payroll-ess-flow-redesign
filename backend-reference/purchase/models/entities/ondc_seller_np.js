'use strict'
const Sequelize = require('sequelize')
const sequelizeConfig = require("../../configs/database/index");

/**
 * One row per ONDC seller NETWORK PARTICIPANT (context.bpp_id) — the seller
 * app, not a provider/shop. Distinct from ondcSellers, which is keyed on
 * (bppId, providerId) for Easy Split payouts.
 *
 * Recorded from every on_search. `enabled` is the ingest gate: disabled NPs
 * stay in this table but their catalogs are not persisted. Admin toggles the
 * flag from Manage > Products > Seller NPs.
 */
const ondcSellerNps = sequelizeConfig.define('ondcSellerNps', {
    id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true
    },
    bppId: {
        type: Sequelize.STRING,
        allowNull: false
    },
    bppUri: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    npName: {
        type: Sequelize.STRING,
        allowNull: true
    },
    domain: {
        type: Sequelize.STRING,
        allowNull: true
    },
    enabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    lastSeenAt: {
        type: Sequelize.DATE,
        allowNull: true
    },
    lastTransactionId: {
        type: Sequelize.STRING,
        allowNull: true
    },
})

const WANTED_COLUMNS = {
    bppUri: { type: Sequelize.TEXT, allowNull: true },
    npName: { type: Sequelize.STRING, allowNull: true },
    domain: { type: Sequelize.STRING, allowNull: true },
    enabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
    lastSeenAt: { type: Sequelize.DATE, allowNull: true },
    lastTransactionId: { type: Sequelize.STRING, allowNull: true },
}

const WANTED_INDEXES = [
    { name: 'ondc_seller_nps_bpp_id', fields: ['bppId'], unique: true },
    { name: 'ondc_seller_nps_enabled', fields: ['enabled'] },
]

const ensureOndcSellerNpsTable = async () => {
    await ondcSellerNps.sync({ force: false })
    const qi = ondcSellerNps.sequelize.getQueryInterface()
    const tableName = ondcSellerNps.getTableName()

    const failures = []

    const describe = await qi.describeTable(tableName)
    for (const [column, definition] of Object.entries(WANTED_COLUMNS)) {
        if (describe[column]) continue
        try {
            await qi.addColumn(tableName, column, definition)
        } catch (error) {
            failures.push(`column ${column}: ${error?.message || error}`)
        }
    }

    const existing = await qi.showIndex(tableName)
    const existingNames = new Set(existing.map((i) => i.name))
    for (const idx of WANTED_INDEXES) {
        if (existingNames.has(idx.name)) continue
        try {
            await qi.addIndex(tableName, idx.fields, { name: idx.name, unique: idx.unique || false })
        } catch (error) {
            failures.push(`index ${idx.name}: ${error?.message || error}`)
        }
    }

    if (failures.length) {
        throw new Error(`ondcSellerNps self-heal incomplete — ${failures.join("; ")}`)
    }
}

ensureOndcSellerNpsTable()
    .then(() => console.log("ondcSellerNps table is ready"))
    .catch((error) => console.error("Error preparing ondcSellerNps table:", error))

module.exports = ondcSellerNps
