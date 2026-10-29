'use strict'
const Sequelize = require('sequelize')
const sequelizeConfig = require("../../configs/database/index");

/**
 * One row per ONDC domain (context.domain, stored as `ONDC:RET10`) — Manage >
 * Products > Rules > "Domains we ingest". `enabled` is an ingest gate: a
 * disabled domain's on_search catalogs are not persisted. A domain first seen
 * on on_search is inserted disabled; `lastSeenAt` null means a row that was
 * seeded but never answered ("nothing received yet").
 *
 * The rollout seed (enabled rows for domains already in use) lives in the
 * ondc_catalog_rules use-case so it can read products and categories.
 */
const ondcDomains = sequelizeConfig.define('ondcDomains', {
    id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true
    },
    code: {
        type: Sequelize.STRING(64),
        allowNull: false
    },
    name: {
        type: Sequelize.STRING,
        allowNull: true
    },
    enabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    firstSeenAt: {
        type: Sequelize.DATE,
        allowNull: true
    },
    lastSeenAt: {
        type: Sequelize.DATE,
        allowNull: true
    },
}, {
    indexes: [
        { name: 'ondc_domains_code', fields: ['code'], unique: true },
    ],
})

// async so a stubbed sequelize (tests) rejects here instead of throwing on require
const ensureTable = async () => { await ondcDomains.sync({ force: false }) }

ondcDomains.ready = ensureTable()
ondcDomains.ready
    .then(() => console.log("ondcDomains table is ready"))
    .catch((error) => console.error("Error preparing ondcDomains table:", error))

module.exports = ondcDomains
