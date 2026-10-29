'use strict'
const Sequelize = require('sequelize')
const sequelizeConfig = require("../../configs/database/index");

/**
 * One row per ONDC IGM (Issue & Grievance) issue/ticket raised against a
 * confirmed order (ondcOrders). The thread itself lives in the sibling
 * ondcIssueEvents table (one row per event) rather than a JSON array here —
 * that's what lets a redelivered on_issue webhook be rejected atomically by a
 * DB unique constraint instead of a hand-rolled, non-atomic read-modify-write
 * on an array. bppId/bppUri/orderId/transactionId are denormalized off the
 * parent order so a follow-up /issue call never needs to re-fetch it.
 */
const ondcIssues = sequelizeConfig.define('ondcIssues', {
    id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true
    },

    // ONDC issue.id — a uuid WE mint at raise time; on_issue/on_issue_status
    // correlate back to our row by this, never by our own `id`.
    issueId: {
        type: Sequelize.STRING,
        allowNull: false
    },

    // parent order linkage
    ondcOrderId: {
        type: Sequelize.BIGINT,
        allowNull: false
    },
    orderId: {
        type: Sequelize.STRING,
        allowNull: true
    },
    transactionId: {
        type: Sequelize.STRING,
        allowNull: true
    },

    // buyer linkage — denormalized so listing an order's issues never needs a
    // join back to ondcOrders just to scope by the requesting buyer
    corporateUserId: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    subCorporateUserId: {
        type: Sequelize.INTEGER,
        allowNull: true
    },

    // seller (BPP) — denormalized so a follow-up /issue call (respond,
    // escalate) never needs to re-fetch the parent order
    bppId: {
        type: Sequelize.STRING,
        allowNull: true
    },
    bppUri: {
        type: Sequelize.TEXT,
        allowNull: true
    },

    // ITEM | FULFILLMENT | ORDER | AGENT — the real, stable ONDC IGM
    // top-level category enum, sent verbatim on the wire.
    category: {
        type: Sequelize.STRING,
        allowNull: false
    },
    // Peko-authored descriptive placeholder — NOT a verified ONDC
    // sub_category code. Confirm against the real network partner's IGM
    // taxonomy before go-live (see utils/issueTaxonomy.ts on the frontend).
    subCategory: {
        type: Sequelize.STRING,
        allowNull: true
    },
    // buyer's original free-text description
    description: {
        type: Sequelize.TEXT,
        allowNull: true
    },

    // OPEN | ACKNOWLEDGED | INFO_REQUESTED | RESPONSE_RECEIVED | RESOLVED |
    // REJECTED | ESCALATED | CLOSED — see controllers/corporate/ondcEcommerce.js
    // (raiseOndcIssue/respondToOndcIssue) and controllers/webhook/ondc.js
    // (onIssue/onIssueStatus) for the transitions. Denormalized here (kept in
    // sync with the latest ondcIssueEvents row) so listing issues never needs
    // to look past this column.
    status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'OPEN'
    },
    // server-clock timestamp of the latest event — also the out-of-order
    // guard: a late, chronologically-older webhook can never regress status
    // past a newer one already recorded (see touchOndcIssueStatus).
    lastActionAt: {
        type: Sequelize.DATE,
        allowNull: true
    },
    // COMPLAINANT | RESPONDENT | SYSTEM — whose action last moved this issue
    lastActorType: {
        type: Sequelize.STRING,
        allowNull: true
    },
    // The counterparty's proposed resolutions, verbatim from IGM 2.0
    // `message.issue.resolutions[]` — a PARENT group plus its options, each with
    // a descriptor.code (REFUND | REPLACEMENT | NO_ACTION | …) and
    // RESOLUTION_DETAILS tags. Refreshed on every on_issue, NOT write-once: 2.0
    // resolutions can be proposed, rejected and re-proposed before anything is
    // final. A JSON blob rather than a child table because we only ever read the
    // whole set to show the buyer what is on offer.
    resolution: {
        type: Sequelize.JSON,
        allowNull: true
    },

    // IGM 2.0 `message.issue.level` — ISSUE, or the escalated (grievance) level.
    // STRING(16) not the default 255: values are short enum tokens.
    level: {
        type: Sequelize.STRING(16),
        allowNull: true
    },

    // IGM 2.0 session: actors, actions, refs, last_action_id, consumer_actor_id.
    // Follow-up /issue calls must replay the seller's actor ids, not invent them.
    igmMeta: {
        type: Sequelize.JSON,
        allowNull: true
    },
})

const WANTED_INDEXES = [
    { name: 'ondc_issues_issue_id', fields: ['issueId'], unique: true },
    { name: 'ondc_issues_order', fields: ['ondcOrderId'] },
    { name: 'ondc_issues_corporate_user', fields: ['corporateUserId'] },
    { name: 'ondc_issues_status', fields: ['status'] },
    { name: 'ondc_issues_transaction_id', fields: ['transactionId'] },
]

// Columns added after the table's initial release — sync() never alters an
// existing table, so these are added idempotently on boot (self-heals), the same
// way models/entities/ondc_issue_event.js and ondc_order.js do it.
const WANTED_COLUMNS = {
    level: { type: Sequelize.STRING(16), allowNull: true },
    resolution: { type: Sequelize.JSON, allowNull: true },
    igmMeta: { type: Sequelize.JSON, allowNull: true },
}

/**
 * sync({force:false}) creates the table if missing; missing columns and indexes
 * are added idempotently on every boot (safe to re-run, self-heals).
 */
const ensureOndcIssuesTable = async () => {
    await ondcIssues.sync({ force: false })
    const qi = ondcIssues.sequelize.getQueryInterface()
    const tableName = ondcIssues.getTableName()

    const describe = await qi.describeTable(tableName)
    for (const [column, definition] of Object.entries(WANTED_COLUMNS)) {
        if (describe[column]) continue
        try {
            await qi.addColumn(tableName, column, definition)
        } catch (error) {
            console.error(`ondcIssues: could not add column ${column}:`, error?.message || error)
        }
    }

    const existing = await qi.showIndex(tableName)
    const existingNames = new Set(existing.map((i) => i.name))
    for (const idx of WANTED_INDEXES) {
        if (existingNames.has(idx.name)) {
            continue
        }
        await qi.addIndex(tableName, idx.fields, { name: idx.name, unique: idx.unique || false })
    }
}

ensureOndcIssuesTable()
    .then(() => console.log("ondcIssues table is ready"))
    .catch((error) => console.error("Error preparing ondcIssues table:", error))

module.exports = ondcIssues
