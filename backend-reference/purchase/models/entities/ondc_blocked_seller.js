'use strict'
const Sequelize = require('sequelize')
const sequelizeConfig = require("../../configs/database/index");

/**
 * Sellers (provider = bppId + providerId) whose products are never stored.
 * Manage > Products > Rules > "Blocked sellers". Unblocking deletes the row.
 */
const ondcBlockedSellers = sequelizeConfig.define('ondcBlockedSellers', {
    id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true
    },
    bppId: {
        // 191 keeps the composite unique index inside InnoDB's key-length limit
        type: Sequelize.STRING(191),
        allowNull: false
    },
    providerId: {
        type: Sequelize.STRING(191),
        allowNull: false
    },
    sellerName: {
        type: Sequelize.STRING,
        allowNull: true
    },
    reason: {
        type: Sequelize.STRING(255),
        allowNull: true
    },
    blockedById: {
        type: Sequelize.STRING,
        allowNull: true
    },
    blockedByName: {
        type: Sequelize.STRING,
        allowNull: true
    },
}, {
    indexes: [
        { name: 'ondc_blocked_sellers_provider', fields: ['bppId', 'providerId'], unique: true },
    ],
})

// async so a stubbed sequelize (tests) rejects here instead of throwing on require
const ensureTable = async () => { await ondcBlockedSellers.sync({ force: false }) }

ensureTable()
    .then(() => console.log("ondcBlockedSellers table is ready"))
    .catch((error) => console.error("Error preparing ondcBlockedSellers table:", error))

module.exports = ondcBlockedSellers
