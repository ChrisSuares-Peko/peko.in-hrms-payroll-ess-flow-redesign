'use strict'
const Sequelize = require('sequelize')
const sequelizeConfig = require("../../configs/database/index");

/**
 * Audit trail for Manage > Products > Rules and > Review: who changed what,
 * when, and how. Backs every "Changed X ago by Y · History" link.
 *
 * section: domains | sellers | keywords | priceSanity | topDeals | review | sellerNps
 * targetType/targetId: the record a change is about, when there is one
 * (`sellerCategory` + its id for the Review page's history).
 */
const ondcCatalogRuleLogs = sequelizeConfig.define('ondcCatalogRuleLogs', {
    id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true
    },
    section: {
        type: Sequelize.STRING(32),
        allowNull: false
    },
    action: {
        type: Sequelize.STRING(255),
        allowNull: false
    },
    detail: {
        type: Sequelize.JSON,
        allowNull: true
    },
    targetType: {
        type: Sequelize.STRING(32),
        allowNull: true
    },
    targetId: {
        type: Sequelize.BIGINT,
        allowNull: true
    },
    actorId: {
        type: Sequelize.STRING,
        allowNull: true
    },
    actorName: {
        type: Sequelize.STRING,
        allowNull: true
    },
}, {
    updatedAt: false,
    // Only indexes on columns the table has always had belong here: sync() on an
    // EXISTING table adds any missing model index, and an index on a column the
    // self-heal below hasn't added yet makes sync() throw before it gets there.
    indexes: [
        { name: 'ondc_catalog_rule_logs_section', fields: ['section', 'createdAt'] },
    ],
})

// The table may predate targetType/targetId — add them, then their index.
const WANTED_COLUMNS = {
    targetType: { type: Sequelize.STRING(32), allowNull: true },
    targetId: { type: Sequelize.BIGINT, allowNull: true },
}
const WANTED_INDEXES = [
    { name: 'ondc_catalog_rule_logs_target', fields: ['targetType', 'targetId'] },
]

// async so a stubbed sequelize (tests) rejects here instead of throwing on require
const ensureTable = async () => {
    await ondcCatalogRuleLogs.sync({ force: false })
    const qi = ondcCatalogRuleLogs.sequelize.getQueryInterface()
    const tableName = ondcCatalogRuleLogs.getTableName()

    // One failure must not skip the rest — collect and report them together.
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
    const existing = new Set((await qi.showIndex(tableName)).map((i) => i.name))
    for (const idx of WANTED_INDEXES) {
        if (existing.has(idx.name)) continue
        try {
            await qi.addIndex(tableName, idx.fields, { name: idx.name })
        } catch (error) {
            failures.push(`index ${idx.name}: ${error?.message || error}`)
        }
    }
    if (failures.length) {
        throw new Error(`ondcCatalogRuleLogs self-heal incomplete — ${failures.join("; ")}`)
    }
}

ensureTable()
    .then(() => console.log("ondcCatalogRuleLogs table is ready"))
    .catch((error) => console.error("Error preparing ondcCatalogRuleLogs table:", error))

module.exports = ondcCatalogRuleLogs
