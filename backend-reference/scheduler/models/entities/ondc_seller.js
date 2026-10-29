'use strict'
const Sequelize = require('sequelize')
const sequelizeConfig = require("../../configs/database/index");

/**
 * Shared table, owned and created by the PURCHASE service. The scheduler reads it
 * only for the seller NETWORK PARTICIPANT's name and contact details, so a
 * TAT-breach alert can tell ops who to chase.
 *
 * FULL mirror — every column purchase declares, deliberately. This app runs a
 * global `sequelize.sync({ force: false })` on boot, which creates a table for
 * every defined model; a PARTIAL mirror that won the race against purchase would
 * create ondcSellers with only the columns named here, leaving purchase's Easy
 * Split queries failing on the rest.
 *
 * So: when purchase adds a column to its ondc_seller entity, add it here too.
 *
 * No ensureTable/indexes here — purchase owns creation, healing and indexing
 * (including the unique (bppId, providerId) index this table is keyed on).
 */
const ondcSellers = sequelizeConfig.define('ondcSellers', {
    id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true
    },

    // ONDC identity — the (bppId, providerId) pair is the seller's key
    bppId: { type: Sequelize.STRING, allowNull: false },
    bppUri: { type: Sequelize.TEXT, allowNull: true },
    providerId: { type: Sequelize.STRING, allowNull: false },
    vendorName: { type: Sequelize.STRING, allowNull: true },
    domain: { type: Sequelize.STRING, allowNull: true },

    // settlement account snapshot from on_init
    settlementType: { type: Sequelize.STRING, allowNull: true },
    settlementCounterparty: { type: Sequelize.STRING, allowNull: true },
    settlementPhase: { type: Sequelize.STRING, allowNull: true },
    upiAddress: { type: Sequelize.STRING, allowNull: true },
    settlementBankAccountNo: { type: Sequelize.STRING, allowNull: true },
    settlementIfscCode: { type: Sequelize.STRING, allowNull: true },
    beneficiaryName: { type: Sequelize.STRING, allowNull: true },
    bankName: { type: Sequelize.STRING, allowNull: true },
    branchName: { type: Sequelize.STRING, allowNull: true },
    settlementDetails: { type: Sequelize.JSON, allowNull: true },

    collectedBy: { type: Sequelize.STRING, allowNull: true },
    buyerFinderFeeType: { type: Sequelize.STRING, allowNull: true },
    buyerFinderFeeAmount: { type: Sequelize.STRING, allowNull: true },

    // tax identity from the bpp_terms tag group
    gstNumber: { type: Sequelize.STRING, allowNull: true },
    panNumber: { type: Sequelize.STRING, allowNull: true },
    bppTerms: { type: Sequelize.JSON, allowNull: true },

    // Cashfree Easy Split registration
    cashfreeVendorId: { type: Sequelize.STRING, allowNull: true },
    cashfreeVendorStatus: { type: Sequelize.STRING, allowNull: true },
    splitEligible: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
    ineligibleReason: { type: Sequelize.STRING, allowNull: true },
    vendorSyncedAt: { type: Sequelize.DATE, allowNull: true },
    lastSyncError: { type: Sequelize.TEXT, allowNull: true },

    lastInitTransactionId: { type: Sequelize.STRING, allowNull: true },
    lastSeenAt: { type: Sequelize.DATE, allowNull: true },

    // Seller NP identity/contact, captured by purchase from the on_search catalog
    // descriptor. The only columns this service actually reads.
    npName: { type: Sequelize.STRING, allowNull: true },
    npContactEmail: { type: Sequelize.STRING, allowNull: true },
    npContactPhone: { type: Sequelize.STRING, allowNull: true },
})

module.exports = ondcSellers
