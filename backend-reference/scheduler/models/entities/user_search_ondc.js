'use strict'
const Sequelize = require('sequelize')
const sequelizeConfig = require("../../configs/database/index");

/**
 * Search registry (shared table, owned/created by the purchase service). The
 * scheduler writes a row here for every office-supply ONDC search it fires, so
 * the purchase on_search webhook can look it up by transactionId and stamp the
 * returned products. Lean mirror of the purchase model — no ensureTable here.
 */
const userSearchOndc = sequelizeConfig.define('userSearchOndc', {
    id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true
    },
    transactionId: {
        type: Sequelize.STRING,
        allowNull: false
    },
    messageId: {
        type: Sequelize.STRING,
        allowNull: true
    },
    search: {
        type: Sequelize.STRING,
        allowNull: true
    },
    source: {
        type: Sequelize.STRING,
        allowNull: true
    },
    localCategory: {
        type: Sequelize.STRING,
        allowNull: true
    },
    ondcCategory: {
        type: Sequelize.STRING,
        allowNull: true
    },
    ondcDomain: {
        type: Sequelize.STRING,
        allowNull: true
    },
    // ONDC city code the search was fired for (column created/migrated by the
    // purchase service; the on_search webhook stamps products with it).
    city: {
        type: Sequelize.STRING,
        allowNull: true
    },
})

module.exports = userSearchOndc
