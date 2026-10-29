'use strict'
const Sequelize = require('sequelize')
const sequelizeConfig = require("../../configs/database/index");

/**
 * One row per ONDC seller — the (bppId, providerId) pair — carrying the payout
 * account and tax identity the BPP hands us in `on_init`
 * (`payment["@ondc/org/settlement_details"]` + the `bpp_terms` tag group), plus
 * that seller's Cashfree Easy Split vendor registration.
 *
 * Until now this data existed only inside a 30-minute in-memory init session and
 * as raw JSON in ondcCallbackLogs.payload — unqueryable, and gone before anyone
 * could settle money against it. Everything else about a seller is denormalized
 * onto ondcProducts / ondcOrders rows; this is the one place a seller is an
 * entity in its own right, because a payout account has to outlive an order.
 *
 * `gstNumber` and `panNumber` are deliberately separate: in bpp_terms
 * `tax_number` is the GST of the seller NETWORK PARTICIPANT while
 * `provider_tax_number` is the PAN of the PROVIDER behind it.
 */
const ondcSellers = sequelizeConfig.define('ondcSellers', {
    id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true
    },

    // --- seller identity ---
    // ONDC subscriber id of the seller app (context.bpp_id). Together with
    // providerId this is the unique key; the cart groups by bppUri|providerId but
    // bppUri is TEXT and can't carry a unique index without a prefix length.
    bppId: {
        type: Sequelize.STRING,
        allowNull: false
    },
    bppUri: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    // provider id — `ondcProducts.ondcVendorId` / `bpp/providers[].id`
    providerId: {
        type: Sequelize.STRING,
        allowNull: false
    },
    vendorName: {
        type: Sequelize.STRING,
        allowNull: true
    },
    domain: {
        type: Sequelize.STRING,
        allowNull: true
    },

    // --- settlement account, flattened from settlement_details[0] ---
    settlementType: {
        type: Sequelize.STRING,
        allowNull: true
    },
    settlementCounterparty: {
        type: Sequelize.STRING,
        allowNull: true
    },
    settlementPhase: {
        type: Sequelize.STRING,
        allowNull: true
    },
    upiAddress: {
        type: Sequelize.STRING,
        allowNull: true
    },
    settlementBankAccountNo: {
        type: Sequelize.STRING,
        allowNull: true
    },
    settlementIfscCode: {
        type: Sequelize.STRING,
        allowNull: true
    },
    beneficiaryName: {
        type: Sequelize.STRING,
        allowNull: true
    },
    bankName: {
        type: Sequelize.STRING,
        allowNull: true
    },
    branchName: {
        type: Sequelize.STRING,
        allowNull: true
    },
    // the whole settlement_details array — later phases beyond sale-amount and
    // anything the BPP adds that we don't flatten
    settlementDetails: {
        type: Sequelize.JSON,
        allowNull: true
    },
    // "BAP" or "BPP" — Easy Split only makes sense when the buyer app collects
    collectedBy: {
        type: Sequelize.STRING,
        allowNull: true
    },
    buyerFinderFeeType: {
        type: Sequelize.STRING,
        allowNull: true
    },
    buyerFinderFeeAmount: {
        type: Sequelize.STRING,
        allowNull: true
    },

    // --- tax identity + terms, from the bpp_terms tag group ---
    // bpp_terms `tax_number` — GST of the seller network participant
    gstNumber: {
        type: Sequelize.STRING,
        allowNull: true
    },
    // bpp_terms `provider_tax_number` — PAN of the provider
    panNumber: {
        type: Sequelize.STRING,
        allowNull: true
    },
    // the full bpp_terms list: max_liability, court_jurisdiction, delay_interest…
    bppTerms: {
        type: Sequelize.JSON,
        allowNull: true
    },

    // --- Cashfree Easy Split registration ---
    cashfreeVendorId: {
        type: Sequelize.STRING,
        allowNull: true
    },
    cashfreeVendorStatus: {
        type: Sequelize.STRING,
        allowNull: true
    },
    // false whenever the settlement details can't be paid to (masked/missing) —
    // the split step skips these and reports them to ops
    splitEligible: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    // stable slug: masked_settlement_details | missing_ifsc | missing_account_no
    //            | missing_upi | no_settlement_details
    ineligibleReason: {
        type: Sequelize.STRING,
        allowNull: true
    },
    vendorSyncedAt: {
        type: Sequelize.DATE,
        allowNull: true
    },
    lastSyncError: {
        type: Sequelize.TEXT,
        allowNull: true
    },

    // --- bookkeeping ---
    lastInitTransactionId: {
        type: Sequelize.STRING,
        allowNull: true
    },
    lastSeenAt: {
        type: Sequelize.DATE,
        allowNull: true
    },

    // Seller NETWORK PARTICIPANT identity/contact, from the on_search catalog's
    // `bpp/descriptor`. Distinct from vendorName, which is the PROVIDER (the shop)
    // — the NP is the seller app we actually chase when a delivery is late.
    // Nullable: plenty of BPPs send no descriptor, and it is never invented.
    npName: {
        type: Sequelize.STRING,
        allowNull: true
    },
    npContactEmail: {
        type: Sequelize.STRING,
        allowNull: true
    },
    npContactPhone: {
        type: Sequelize.STRING,
        allowNull: true
    },
})

// Columns added after the table's initial release — sync() never alters an
// existing table, so these are added idempotently on boot (self-heals), the same
// way models/entities/ondc_order.js does it.
const WANTED_COLUMNS = {
    npName: { type: Sequelize.STRING, allowNull: true },
    npContactEmail: { type: Sequelize.STRING, allowNull: true },
    npContactPhone: { type: Sequelize.STRING, allowNull: true },
}

const WANTED_INDEXES = [
    { name: 'ondc_sellers_bpp_provider', fields: ['bppId', 'providerId'], unique: true },
    { name: 'ondc_sellers_cashfree_vendor', fields: ['cashfreeVendorId'] },
    { name: 'ondc_sellers_split_eligible', fields: ['splitEligible'] },
]

/**
 * sync({force:false}) creates the table if missing; columns/indexes are added
 * idempotently on every boot (safe to re-run, self-heals).
 */
const ensureOndcSellersTable = async () => {
    await ondcSellers.sync({ force: false })
    const qi = ondcSellers.sequelize.getQueryInterface()
    const tableName = ondcSellers.getTableName()

    // Each add is guarded and NAMED individually — one rejected ALTER must not
    // abort the loop and silently skip every later column and the indexes, which
    // would surface only as "Unknown column" 500s from every ondcSellers query
    // (the model declares the column, so Sequelize names it in every SELECT).
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
        throw new Error(`ondcSellers self-heal incomplete — ${failures.join("; ")}`)
    }
}

ensureOndcSellersTable()
    .then(() => console.log("ondcSellers table is ready"))
    .catch((error) => console.error("Error preparing ondcSellers table:", error))

module.exports = ondcSellers
