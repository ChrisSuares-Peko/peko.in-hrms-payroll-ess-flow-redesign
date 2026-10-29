'use strict'
/**
 * Backfills the payment facts on ONDC orders Peko actually collected for.
 *
 * Both order-creation paths used to persist the BPP's echoed payment block, and a BPP
 * echoes its OWN terms: the DigiDukaan spec's /on_confirm returns
 * `status: "NOT-PAID"`, `type: "ON-FULFILLMENT"`, `collected_by: "BPP"` because that
 * spec models pay-on-fulfilment. Peko is the BAP and captures on Cashfree BEFORE
 * /confirm, so every prepaid order was stored as "Not paid" and the admin Orders list
 * showed all of them that way.
 *
 * The code fix is resolveBuyerPayment (utils/ondc_helper.js); this repairs rows already
 * written. Scoped to rows that have a paymentRef — i.e. ones we collected for — so a
 * genuinely seller-collected/COD order is never mislabelled as paid.
 *
 * NOT reversible in a meaningful way: the BPP's original echo is still in the
 * `payment` JSON column, so `down` is a documented no-op rather than a guess.
 */
const ONDC_ORDERS = 'ondcOrders'

const hasTable = async (queryInterface, table) => {
  const tables = await queryInterface.showAllTables()
  return tables.some((t) => String(t).toLowerCase() === table.toLowerCase())
}

module.exports = {
  async up(queryInterface) {
    if (!(await hasTable(queryInterface, ONDC_ORDERS))) return
    const desc = await queryInterface.describeTable(ONDC_ORDERS)
    if (!desc.paymentStatus || !desc.paymentRef) return

    const [result] = await queryInterface.sequelize.query(`
      UPDATE \`${ONDC_ORDERS}\`
         SET \`paymentStatus\` = 'PAID',
             \`paymentType\`   = 'ON-ORDER',
             \`collectedBy\`   = 'BAP'
       WHERE \`paymentRef\` IS NOT NULL
         AND \`paymentRef\` <> ''
         AND (\`paymentStatus\` IS NULL OR \`paymentStatus\` <> 'PAID')
    `)
    console.log(`Backfilled paid status on ${result?.affectedRows ?? 0} ondcOrders row(s)`)
  },

  async down() {
    // Intentionally a no-op — see the file comment. The seller's original payment
    // block is preserved in ondcOrders.payment if it is ever needed.
  },
}
