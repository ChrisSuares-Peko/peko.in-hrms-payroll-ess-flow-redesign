'use strict'
/**
 * Read/write mirror of purchase's `ondcSellers` table. Settlement details are
 * written at on_init by the purchase service; paymentGateway reads them here
 * after Cashfree capture to create Easy Split vendors and write the split rule.
 *
 * Table creation/indexes live in purchase — do not sync from this service.
 */
const Sequelize = require('sequelize')
const sequelizeConfig = require("../../configs/database/index");

const ondcSellers = sequelizeConfig.define('ondcSellers', {
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
    settlementDetails: {
        type: Sequelize.JSON,
        allowNull: true
    },
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
    gstNumber: {
        type: Sequelize.STRING,
        allowNull: true
    },
    panNumber: {
        type: Sequelize.STRING,
        allowNull: true
    },
    bppTerms: {
        type: Sequelize.JSON,
        allowNull: true
    },
    cashfreeVendorId: {
        type: Sequelize.STRING,
        allowNull: true
    },
    cashfreeVendorStatus: {
        type: Sequelize.STRING,
        allowNull: true
    },
    splitEligible: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
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
    lastInitTransactionId: {
        type: Sequelize.STRING,
        allowNull: true
    },
    lastSeenAt: {
        type: Sequelize.DATE,
        allowNull: true
    },
})

module.exports = ondcSellers
