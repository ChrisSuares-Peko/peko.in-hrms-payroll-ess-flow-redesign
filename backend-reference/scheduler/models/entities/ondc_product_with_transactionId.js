'use strict'
const Sequelize = require('sequelize')
const sequelizeConfig = require("../../configs/database/index");

/**
 * Lean mirror of the purchase `ondcProducts` model (shared table, owned/created
 * by the purchase service). A midnight IST job deletes office-supply rows not
 * refreshed in 24 hours, then every source already at qty <= 0.
 */
const ondcProducts = sequelizeConfig.define('ondcProducts', {
    id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true
    },
    source: {
        type: Sequelize.STRING,
        allowNull: true
    },
    availableQuantity: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
})

module.exports = ondcProducts
