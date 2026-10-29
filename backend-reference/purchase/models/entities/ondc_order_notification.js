'use strict'
const Sequelize = require('sequelize')
const sequelizeConfig = require("../../configs/database/index");

/**
 * Append-only ledger of buyer notification emails sent about an ONDC order — one
 * row per (order, event). It is BOTH the send-once lock and the audit trail.
 *
 * Why a table rather than a DATE column per event on ondcOrders (the shape
 * `invoiceEmailSentAt` and `tatBreachNotifiedAt` use):
 *
 *   1. ondcOrders sits at InnoDB's row-size limit and ensureOndcOrdersTable()
 *      THROWS when an ALTER is rejected — after which every ondcOrders SELECT
 *      fails with "Unknown column", because Sequelize names the model's columns
 *      in every query. Nine more columns is a bet whose downside is a whole-flow
 *      outage. This table cannot lose that bet.
 *   2. The key space isn't boolean. "Delayed" must send once per DISTINCT revised
 *      ETA (`eta:2026-09-01`), a refund once per refundId (`refund:refund_ondc_12_0`),
 *      an exception once per code (`exception:Delivery-failed`). A column per
 *      event can't express that; a compound eventKey can.
 *   3. Support asks "what did we send this buyer, and when" — a question an
 *      overwritten timestamp column cannot answer.
 *
 * The claim is INSERT-wins on the UNIQUE (ondcOrderId, eventKey) index — the same
 * idiom ondcOrderRefunds uses to stop double refunds, so it is proven against
 * this DB under money. See models/use-cases/ondc_order_notification.js.
 *
 * House rule inherited from claimOndcOrderInvoiceEmail: NEVER claim a row you are
 * not about to email about, and never un-claim. A claim without a send silences
 * that notification permanently, which is why every sender resolves its recipient
 * BEFORE claiming.
 */
const ondcOrderNotifications = sequelizeConfig.define('ondcOrderNotifications', {
    id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true
    },

    ondcOrderId: {
        type: Sequelize.BIGINT,
        allowNull: false
    },
    // ondcOrders.transactionId — the key the webhook paths hold before they have a row id.
    transactionId: {
        type: Sequelize.STRING(64),
        allowNull: true
    },
    // What was sent: "status:shipped", "cancel:seller", "eta:2026-09-01",
    // "refund:refund_ondc_12_0", "return:completed". Half of the UNIQUE index.
    // STRING(64), not the default 255: this table will carry ~10 rows per order and
    // the index is on (BIGINT, this) — a 255-wide utf8mb4 column costs 1020 bytes of
    // index key for no benefit, and the longest real key is well under 64.
    eventKey: {
        type: Sequelize.STRING(64),
        allowNull: false
    },
    sentAt: {
        type: Sequelize.DATE,
        allowNull: false
    },
    // Where it went. The support question is "did the buyer get it", and after a
    // recipient change the current corporate row no longer answers that.
    recipient: {
        type: Sequelize.STRING(191),
        allowNull: true
    },
    logTraceId: {
        type: Sequelize.STRING,
        allowNull: true
    },
})

const WANTED_INDEXES = [
    // THE send-once guard — a replayed callback collides here.
    { name: 'ondc_order_notifications_event', fields: ['ondcOrderId', 'eventKey'], unique: true },
    { name: 'ondc_order_notifications_txn', fields: ['transactionId'] },
]

// Added-later columns, patched idempotently on boot (ondc_order.js pattern).
const WANTED_COLUMNS = {}

/**
 * sync({force:false}) creates the table if missing; columns/indexes are added
 * idempotently on every boot (safe to re-run, self-heals).
 */
const ensureOndcOrderNotificationsTable = async () => {
    await ondcOrderNotifications.sync({ force: false })
    const qi = ondcOrderNotifications.sequelize.getQueryInterface()
    const tableName = ondcOrderNotifications.getTableName()
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
        // Named and thrown rather than swallowed — a missing unique index silently
        // removes the send-once guard, and the failure mode is mailing a buyer the
        // same "Packed" notice every hour for the life of the order.
        throw new Error(
            `ondcOrderNotifications schema incomplete — ${failures.length} change(s) rejected: ${failures.join('; ')}`
        )
    }
}

ensureOndcOrderNotificationsTable()
    .then(() => console.log("ondcOrderNotifications table is ready"))
    .catch((error) => console.error("Error preparing ondcOrderNotifications table:", error))

module.exports = ondcOrderNotifications
