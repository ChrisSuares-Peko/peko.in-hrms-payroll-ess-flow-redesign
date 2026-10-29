'use strict'
const Sequelize = require('sequelize')
const sequelizeConfig = require("../../configs/database/index");

/**
 * Shared table, owned and created by the PURCHASE service. The scheduler reads it
 * to find orders that blew their delivery TAT, and stamps `tatBreachNotifiedAt`.
 *
 * FULL mirror — every column purchase declares, deliberately. This app runs a
 * global `sequelize.sync({ force: false })` on boot, which creates a table for
 * every defined model; a PARTIAL mirror that won the race against purchase would
 * create ondcOrders with only the columns named here, leaving purchase's queries
 * failing on the rest (see models/use-cases/ondcCategory.js for the same hazard).
 *
 * So: when purchase adds a column to its ondc_order entity, add it here too.
 * Types and lengths must match — several are deliberately narrowed (STRING(16),
 * STRING(24)) because ondcOrders sits at InnoDB's row-size limit.
 *
 * No ensureTable/indexes here — purchase owns creation, healing and indexing.
 */
const ondcOrders = sequelizeConfig.define('ondcOrders', {
    id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true
    },

    // order identity — transactionId spans the whole search→confirm session
    transactionId: { type: Sequelize.STRING, allowNull: false },
    orderId: { type: Sequelize.STRING, allowNull: true },
    orderState: { type: Sequelize.STRING, allowNull: true },

    // buyer linkage
    corporateUserId: { type: Sequelize.INTEGER, allowNull: true },
    subCorporateUserId: { type: Sequelize.INTEGER, allowNull: true },

    // seller (BPP + provider)
    bppId: { type: Sequelize.STRING, allowNull: true },
    bppUri: { type: Sequelize.TEXT, allowNull: true },
    providerId: { type: Sequelize.STRING, allowNull: true },
    vendorName: { type: Sequelize.STRING, allowNull: true },
    domain: { type: Sequelize.STRING, allowNull: true },
    city: { type: Sequelize.STRING, allowNull: true },

    // delivery estimate — raw @ondc/org/TAT and confirmedAt + TAT. The TAT-breach
    // sweep measures against expectedDeliveryDate, falling back to createdAt when
    // the BPP declared no TAT.
    deliveryTat: { type: Sequelize.STRING, allowNull: true },
    expectedDeliveryDate: { type: Sequelize.DATE, allowNull: true },

    // amounts
    totalAmount: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
    currency: { type: Sequelize.STRING, allowNull: true },
    platformFee: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    amountPaid: { type: Sequelize.DECIMAL(12, 2), allowNull: true },

    // payment + settlement terms (flattened from on_confirm payment)
    paymentStatus: { type: Sequelize.STRING, allowNull: true },
    paymentType: { type: Sequelize.STRING, allowNull: true },
    collectedBy: { type: Sequelize.STRING, allowNull: true },
    paymentRef: { type: Sequelize.STRING, allowNull: true },
    settlementBasis: { type: Sequelize.STRING, allowNull: true },
    settlementWindow: { type: Sequelize.STRING, allowNull: true },
    withholdingAmount: { type: Sequelize.STRING, allowNull: true },
    settlementType: { type: Sequelize.STRING, allowNull: true },
    upiAddress: { type: Sequelize.STRING, allowNull: true },
    settlementBankAccountNo: { type: Sequelize.STRING, allowNull: true },
    settlementIfscCode: { type: Sequelize.STRING, allowNull: true },
    beneficiaryName: { type: Sequelize.STRING, allowNull: true },
    bankName: { type: Sequelize.STRING, allowNull: true },
    branchName: { type: Sequelize.STRING, allowNull: true },

    // full-fidelity JSON blobs from the confirmed order
    items: { type: Sequelize.JSON, allowNull: true },
    quote: { type: Sequelize.JSON, allowNull: true },
    billing: { type: Sequelize.JSON, allowNull: true },
    fulfillments: { type: Sequelize.JSON, allowNull: true },
    payment: { type: Sequelize.JSON, allowNull: true },
    tracking: { type: Sequelize.JSON, allowNull: true },
    // server-clock timestamps of the last persisted on_status / on_track callback
    statusCheckedAt: { type: Sequelize.DATE, allowNull: true },
    trackingCheckedAt: { type: Sequelize.DATE, allowNull: true },

    // cancellation / return lifecycle
    cancelReason: { type: Sequelize.STRING, allowNull: true },
    cancelledAt: { type: Sequelize.DATE, allowNull: true },
    returnReason: { type: Sequelize.STRING, allowNull: true },
    returnedAt: { type: Sequelize.DATE, allowNull: true },
    returnStatus: { type: Sequelize.STRING(32), allowNull: true },
    returnRequestId: { type: Sequelize.STRING(64), allowNull: true },
    returnMeta: { type: Sequelize.JSON, allowNull: true },
    returnRefundedAt: { type: Sequelize.DATE, allowNull: true },
    cancellationTerms: { type: Sequelize.JSON, allowNull: true },

    // Cashfree Easy Split: how this seller's share was settled
    splitVendorId: { type: Sequelize.STRING, allowNull: true },
    splitStatus: { type: Sequelize.STRING, allowNull: true },
    splitAmount: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
    splitError: { type: Sequelize.TEXT, allowNull: true },

    // Return-window payout hold
    deliveredAt: { type: Sequelize.DATE, allowNull: true },
    // Narrowed on purpose — see the row-size note in the header.
    returnWindow: { type: Sequelize.STRING(16), allowNull: true },
    payoutDueAt: { type: Sequelize.DATE, allowNull: true },
    payoutStatus: { type: Sequelize.STRING(24), allowNull: true },
    payoutEligibilityDate: { type: Sequelize.DATE, allowNull: true },
    payoutReleasedAt: { type: Sequelize.DATE, allowNull: true },
    payoutAttempts: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
    payoutError: { type: Sequelize.TEXT, allowNull: true },

    refundedAmount: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },

    // When the internal team was alerted that this order blew its delivery TAT.
    // This scheduler's own write, and the sweep's lock: claimed with a
    // compare-and-set from NULL before the mail is sent, so overlapping passes
    // can't double-alert and the alert stays once-per-order.
    tatBreachNotifiedAt: { type: Sequelize.DATE, allowNull: true },
})

module.exports = ondcOrders
