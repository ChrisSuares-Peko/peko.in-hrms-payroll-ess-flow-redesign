'use strict'
/**
 * Adds the two response columns to `ondcConfirmAttempts`:
 *
 *   confirmResponse    the synchronous /confirm answer paymentGateway got (it sends
 *                      /confirm itself, straight from the payment callback)
 *   onConfirmResponse  the seller's on_confirm as received by purchase's webhook
 *
 * Mirrors WANTED_COLUMNS in models/entities/ondc_confirm_attempt.js, which heals the
 * same columns on boot — so this is idempotent whichever runs first. A no-op when
 * the table does not exist yet (the entity creates it with both columns).
 */
const ONDC_CONFIRM_ATTEMPTS = 'ondcConfirmAttempts'

const COLUMNS = (Sequelize) => ({
  confirmResponse: { type: Sequelize.JSON, allowNull: true },
  onConfirmResponse: { type: Sequelize.JSON, allowNull: true },
})

const hasTable = async (queryInterface, table) => {
  const tables = await queryInterface.showAllTables()
  return tables.some((t) => String(t).toLowerCase() === table.toLowerCase())
}

module.exports = {
  async up(queryInterface, Sequelize) {
    if (!(await hasTable(queryInterface, ONDC_CONFIRM_ATTEMPTS))) return
    const desc = await queryInterface.describeTable(ONDC_CONFIRM_ATTEMPTS)
    for (const [name, definition] of Object.entries(COLUMNS(Sequelize))) {
      if (!desc[name]) {
        await queryInterface.addColumn(ONDC_CONFIRM_ATTEMPTS, name, definition)
      }
    }
  },

  async down(queryInterface) {
    if (!(await hasTable(queryInterface, ONDC_CONFIRM_ATTEMPTS))) return
    const desc = await queryInterface.describeTable(ONDC_CONFIRM_ATTEMPTS)
    for (const name of Object.keys(COLUMNS({ JSON: null }))) {
      if (desc[name]) {
        await queryInterface.removeColumn(ONDC_CONFIRM_ATTEMPTS, name)
      }
    }
  },
}
