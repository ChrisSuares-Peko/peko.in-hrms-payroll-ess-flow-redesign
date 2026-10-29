'use strict'
const Sequelize = require('sequelize')
const sequelizeConfig = require("../../configs/database/index");

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

    // ============================================================
    // search registry metadata — set when a search is fired so the
    // on_search webhook can stamp the resulting products. For office
    // supplies these come from utils/ondcOfficeSupplies.json.
    // ============================================================
    // origin of this search, e.g. "OFFICE_SUPPLIES"
    source: {
        type: Sequelize.STRING,
        allowNull: true
    },
    // ONDC domain searched (e.g. "ONDC:RET16")
    ondcDomain: {
        type: Sequelize.STRING,
        allowNull: true
    },
    // ONDC city code the search was fired for (e.g. "std:080"). The on_search
    // webhook prefers this over the callback's context.city so products get
    // tagged with the city the user actually requested.
    city: {
        type: Sequelize.STRING,
        allowNull: true
    },
    // UUID for one city+domain catalog_full. on_search stamps products with it
    // so the delayed snapshot reconcile can drop SKUs this search did not send.
    catalogSweepId: {
        type: Sequelize.STRING,
        allowNull: true
    },
})

/**
 * Sequelize sync({force:false}) creates the table if missing but never adds new
 * columns to an existing table. Since this table already exists, we add any
 * missing columns/indexes idempotently on boot (describeTable -> addColumn).
 */
const WANTED_COLUMNS = {
    source: { type: Sequelize.STRING, allowNull: true },
    ondcDomain: { type: Sequelize.STRING, allowNull: true },
    city: { type: Sequelize.STRING, allowNull: true },
    catalogSweepId: { type: Sequelize.STRING, allowNull: true },
}

const WANTED_INDEXES = [
    { name: 'user_search_ondc_transaction_id', fields: ['transactionId'] },
    { name: 'user_search_ondc_source', fields: ['source'] },
    { name: 'user_search_ondc_city_domain', fields: ['city', 'ondcDomain'] },
]

const ensureUserSearchOndcTable = async () => {
    await userSearchOndc.sync({ force: false }) // create table if not exists; never drops
    const qi = userSearchOndc.sequelize.getQueryInterface()
    const tableName = userSearchOndc.getTableName()

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
            await qi.addIndex(tableName, idx.fields, { name: idx.name })
        }
    }
}

ensureUserSearchOndcTable()
    .then(() => console.log("userSearchOndc table is ready"))
    .catch((error) => console.error("Error preparing userSearchOndc table:", error))

module.exports = userSearchOndc
