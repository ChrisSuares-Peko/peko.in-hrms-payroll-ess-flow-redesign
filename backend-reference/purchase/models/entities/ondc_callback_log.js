'use strict'
const Sequelize = require('sequelize')
const sequelizeConfig = require("../../configs/database/index");

/**
 * Audit log of the ONDC order-lifecycle callbacks (on_select / on_init /
 * on_confirm), one row per webhook hit with the FULL raw body. The live flow
 * only holds these in memory (waiters + session cache), so this table is what
 * lets us examine exactly what a seller sent when something goes wrong later
 * (NACKs, quote disputes, settlement mismatches).
 *
 * on_search is intentionally NOT logged here — catalogs are huge and already
 * persisted as ondcProducts rows.
 */
const ondcCallbackLogs = sequelizeConfig.define('ondcCallbackLogs', {
    id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true
    },

    // "on_select" | "on_init" | "on_confirm"
    action: {
        type: Sequelize.STRING,
        allowNull: false
    },

    // ONDC context — the correlation keys for debugging a session
    transactionId: {
        type: Sequelize.STRING,
        allowNull: true
    },
    messageId: {
        type: Sequelize.STRING,
        allowNull: true
    },
    bppId: {
        type: Sequelize.STRING,
        allowNull: true
    },
    bppUri: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    domain: {
        type: Sequelize.STRING,
        allowNull: true
    },

    // NACK/error callbacks: flag + the ONDC error object
    hasError: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    error: {
        type: Sequelize.JSON,
        allowNull: true
    },

    // the FULL raw req.body (context + message) as received
    payload: {
        type: Sequelize.JSON,
        allowNull: true
    },
})

const WANTED_INDEXES = [
    { name: 'ondc_callback_logs_transaction_id', fields: ['transactionId'] },
    { name: 'ondc_callback_logs_action_transaction', fields: ['action', 'transactionId'] },
]

/**
 * sync({force:false}) creates the table if missing; indexes are added
 * idempotently on every boot (safe to re-run, self-heals).
 */
const ensureOndcCallbackLogsTable = async () => {
    await ondcCallbackLogs.sync({ force: false })
    const qi = ondcCallbackLogs.sequelize.getQueryInterface()
    const tableName = ondcCallbackLogs.getTableName()

    const existing = await qi.showIndex(tableName)
    const existingNames = new Set(existing.map((i) => i.name))
    for (const idx of WANTED_INDEXES) {
        if (!existingNames.has(idx.name)) {
            await qi.addIndex(tableName, idx.fields, { name: idx.name })
        }
    }
}

ensureOndcCallbackLogsTable()
    .then(() => console.log("ondcCallbackLogs table is ready"))
    .catch((error) => console.error("Error preparing ondcCallbackLogs table:", error))

module.exports = ondcCallbackLogs
