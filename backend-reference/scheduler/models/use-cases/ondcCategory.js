'use strict'
const { QueryTypes } = require('sequelize')
const sequelizeConfig = require("../../configs/database/index");

/**
 * Read-only access to the `officeSupplyCategories` table, which is OWNED by the
 * purchase service (Peko-IN/purchase/models/entities/ondc_category.js).
 *
 * Deliberately a raw query rather than a sequelize.define() mirror: this app's
 * DB config runs a global sequelize.sync({ force: false }) on boot, which
 * creates a table for every defined model. A partial mirror here would race the
 * purchase service and create the table with only the columns it declares,
 * leaving purchase's queries failing on the missing ones.
 */

/** Distinct non-empty ondcDomain values across enabled rows. */
exports.findEnabledOndcDomains = async () => {
    const rows = await sequelizeConfig.query(
        `SELECT DISTINCT ondcDomain
           FROM officeSupplyCategories
          WHERE enabled = true
            AND ondcDomain IS NOT NULL
            AND ondcDomain <> ''`,
        { type: QueryTypes.SELECT }
    )
    return rows.map((row) => row.ondcDomain)
}
