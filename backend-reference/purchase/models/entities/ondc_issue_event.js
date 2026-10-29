'use strict'
const Sequelize = require('sequelize')
const sequelizeConfig = require("../../configs/database/index");

/**
 * One row per event in an ondcIssues thread (buyer raise/reply, or a seller's
 * on_issue/on_issue_status push) — an append-only log, not a JSON array on
 * the parent row. That split is what makes this table's own unique index the
 * load-bearing idempotency guard for the whole "Raise an issue" feature:
 * ONDC webhooks are at-least-once (a slow/missing ACK gets redelivered), and
 * without a DB-level constraint, two concurrent deliveries could both read
 * the parent's state before either writes and both append a duplicate event.
 * Here the second insert simply violates ondc_issue_events_issue_dedupe and
 * is swallowed as a no-op by recordOndcIssueEvent
 * (models/use-cases/ondc_issue_event.js) — no app-code race possible.
 */
const ondcIssueEvents = sequelizeConfig.define('ondcIssueEvents', {
    id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true
    },

    ondcIssueId: {
        type: Sequelize.BIGINT,
        allowNull: false
    },

    // same vocabulary as ondcIssues.status — every event IS the new status
    eventType: {
        type: Sequelize.STRING,
        allowNull: false
    },
    // COMPLAINANT | RESPONDENT | SYSTEM
    actorType: {
        type: Sequelize.STRING,
        allowNull: false
    },
    actorName: {
        type: Sequelize.STRING,
        allowNull: true
    },
    message: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    // LOCAL_RAISE | LOCAL_RESPOND | on_issue | on_issue_status — where this
    // event came from, for debugging.
    sourceAction: {
        type: Sequelize.STRING,
        allowNull: true
    },
    // the actor's own declared timestamp (buyer's local submit time, or the
    // seller's issue_actions[].updated_at) — used for display ordering AND
    // the out-of-order guard (touchOndcIssueStatus), NOT the row's createdAt.
    occurredAt: {
        type: Sequelize.DATE,
        allowNull: false
    },
    // webhook events: the ONDC context.message_id (a genuine redelivery
    // repeats it). Buyer-originated events: a uuid the frontend mints once
    // per submit attempt (guards double-click/second-tab/retry-after-timeout).
    // Multiple NULLs never collide under MySQL's unique-index semantics.
    dedupeKey: {
        type: Sequelize.STRING,
        allowNull: true
    },
    // Evidence photos attached to this event — an array of PUBLIC image URLs
    // (Firebase), NOT base64. The controller uploads the buyer's base64 via
    // commonUploadFile.uploadFile() and stores only the resulting URLs here;
    // seller-attached images (from on_issue) land here too.
    images: {
        type: Sequelize.JSON,
        allowNull: true
    },
})

const WANTED_INDEXES = [
    { name: 'ondc_issue_events_issue', fields: ['ondcIssueId'] },
    // THE idempotency/concurrency guard — see file-level comment above.
    { name: 'ondc_issue_events_issue_dedupe', fields: ['ondcIssueId', 'dedupeKey'], unique: true },
    { name: 'ondc_issue_events_event_type', fields: ['eventType'] },
]

// Columns added after the table's initial release — sync() never alters an
// existing table, so these are added idempotently on boot (self-heals),
// mirroring ondc_order.js's WANTED_COLUMNS pattern.
const WANTED_COLUMNS = {
    images: { type: Sequelize.JSON, allowNull: true },
}

/**
 * sync({force:false}) creates the table if missing; columns/indexes are added
 * idempotently on every boot (safe to re-run, self-heals).
 */
const ensureOndcIssueEventsTable = async () => {
    await ondcIssueEvents.sync({ force: false })
    const qi = ondcIssueEvents.sequelize.getQueryInterface()
    const tableName = ondcIssueEvents.getTableName()

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
            await qi.addIndex(tableName, idx.fields, { name: idx.name, unique: idx.unique || false })
        }
    }
}

ensureOndcIssueEventsTable()
    .then(() => console.log("ondcIssueEvents table is ready"))
    .catch((error) => console.error("Error preparing ondcIssueEvents table:", error))

module.exports = ondcIssueEvents
