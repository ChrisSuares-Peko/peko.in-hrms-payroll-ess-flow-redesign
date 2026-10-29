'use strict'
const Sequelize = require('sequelize')
const sequelizeConfig = require("../../configs/database/index");

/**
 * Words/phrases that keep a product out of the DB when found (whole word) in
 * its name or description. Stored normalised — see utils/ondcKeywordMatch.js.
 * Manage > Products > Rules > "Banned keywords".
 */
const ondcBannedKeywords = sequelizeConfig.define('ondcBannedKeywords', {
    id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true
    },
    word: {
        type: Sequelize.STRING(100),
        allowNull: false
    },
    addedById: {
        type: Sequelize.STRING,
        allowNull: true
    },
    addedByName: {
        type: Sequelize.STRING,
        allowNull: true
    },
}, {
    indexes: [
        { name: 'ondc_banned_keywords_word', fields: ['word'], unique: true },
    ],
})

// async so a stubbed sequelize (tests) rejects here instead of throwing on require
const ensureTable = async () => { await ondcBannedKeywords.sync({ force: false }) }

ensureTable()
    .then(() => console.log("ondcBannedKeywords table is ready"))
    .catch((error) => console.error("Error preparing ondcBannedKeywords table:", error))

module.exports = ondcBannedKeywords
