'use strict'
/**
 * Backfills the seller name on ONDC orders that were written without one.
 *
 * on_confirm persist used to derive vendorName solely from
 * `order.provider.descriptor.name`. That field is OPTIONAL in ONDC — plenty of
 * BPPs echo `provider: { id, locations }` only — so those rows were stored with
 * an empty vendorName and rendered as a blank Seller cell in Order History,
 * while providerId (ONDC-required) came through fine.
 *
 * The code fix is resolveVendorName (services/ondcOnConfirmPersist.js); this
 * repairs rows already written, using the ondcSellers registry, which is
 * populated at /init from the catalog and keyed on exactly the (bppId,
 * providerId) pair every order row carries.
 *
 * Idempotent: once a row has a name it no longer matches, so re-running is a
 * no-op. `down` is intentionally a no-op — the previous value was empty, so
 * there is nothing meaningful to restore.
 */
const ONDC_ORDERS = 'ondcOrders'
const ONDC_SELLERS = 'ondcSellers'

const hasTable = async (queryInterface, table) => {
  const tables = await queryInterface.showAllTables()
  return tables.some((t) => String(t).toLowerCase() === table.toLowerCase())
}

module.exports = {
  async up(queryInterface) {
    if (!(await hasTable(queryInterface, ONDC_ORDERS))) return
    // ondcSellers is a recent addition (20260731000001) — skip cleanly if absent.
    if (!(await hasTable(queryInterface, ONDC_SELLERS))) return

    const orders = await queryInterface.describeTable(ONDC_ORDERS)
    const sellers = await queryInterface.describeTable(ONDC_SELLERS)
    if (!orders.vendorName || !orders.bppId || !orders.providerId) return
    if (!sellers.vendorName || !sellers.bppId || !sellers.providerId) return

    const [result] = await queryInterface.sequelize.query(`
      UPDATE \`${ONDC_ORDERS}\` o
        JOIN \`${ONDC_SELLERS}\` s
          ON s.\`bppId\` = o.\`bppId\`
         AND s.\`providerId\` = o.\`providerId\`
         SET o.\`vendorName\` = s.\`vendorName\`
       WHERE (o.\`vendorName\` IS NULL OR TRIM(o.\`vendorName\`) = '')
         AND s.\`vendorName\` IS NOT NULL
         AND TRIM(s.\`vendorName\`) <> ''
    `)
    console.log(`Backfilled vendorName on ${result?.affectedRows ?? 0} ondcOrders row(s)`)
  },

  async down() {
    // Intentionally a no-op — the prior value was an empty string, so there is
    // nothing to restore and re-blanking real seller names would be a regression.
  },
}
