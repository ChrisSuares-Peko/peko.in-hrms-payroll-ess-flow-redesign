'use strict'
/**
 * Adds the return-window payout-hold columns to ondcOrders, and repairs the
 * partially-applied state left by the first attempt at this change.
 *
 * WHY THE NARROW STRING TYPES MATTER: ondcOrders already carries ~28
 * VARCHAR(255) columns, each costing 1020 bytes of InnoDB's row-size budget under
 * utf8mb4. The original version of this migration declared `returnWindow` and
 * `payoutStatus` as the default STRING (255). `returnWindow` became the 29th such
 * column and fit; `payoutStatus` would have been the 30th and MySQL rejected the
 * ALTER. Because the boot-time ensureOndcOrdersTable() had no per-column guard,
 * that one rejection aborted the rest of the loop — so `payoutStatus`,
 * `payoutEligibilityDate`, `payoutReleasedAt`, `payoutAttempts`, `payoutError`
 * and BOTH indexes were never created, while the model still declared them.
 * Sequelize names every declared attribute in its SELECTs, so every ondcOrders
 * query then failed with "Unknown column 'payoutStatus' in 'field list'".
 *
 * VARCHAR(24) holds the longest payoutStatus ("NOT_APPLICABLE", 14 chars) and
 * VARCHAR(16) the longest return window ("P1DT1H", 6) — together ~1900 bytes
 * cheaper than two 255-wide columns, which is what makes the ALTER succeed.
 *
 * House pattern: tables are created by sync()/ensureTable on boot; migrations only
 * patch columns and return early if the table is absent. Guarded throughout, so it
 * is safe to re-run and safe on a database where some columns already exist.
 */
const ONDC_ORDERS = 'ondcOrders'

const COLUMNS = (Sequelize) => ({
  deliveredAt: { type: Sequelize.DATE, allowNull: true },
  returnWindow: { type: Sequelize.STRING(16), allowNull: true },
  payoutDueAt: { type: Sequelize.DATE, allowNull: true },
  payoutStatus: { type: Sequelize.STRING(24), allowNull: true },
  payoutEligibilityDate: { type: Sequelize.DATE, allowNull: true },
  payoutReleasedAt: { type: Sequelize.DATE, allowNull: true },
  payoutAttempts: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
  payoutError: { type: Sequelize.TEXT, allowNull: true },
})

const INDEXES = [
  { name: 'ondc_orders_payout_due', fields: ['payoutStatus', 'payoutDueAt'] },
  { name: 'ondc_orders_delivered_at', fields: ['deliveredAt'] },
]

/** Columns the first attempt may have created at the wrong width, and their target. */
const NARROW = { returnWindow: 16, payoutStatus: 24 }

const hasTable = async (queryInterface, table) => {
  const tables = await queryInterface.showAllTables()
  return tables.some((t) => String(t).toLowerCase() === table.toLowerCase())
}

/** Declared character length of an existing column, or null when not determinable. */
const currentLength = (desc, column) => {
  const m = String(desc[column]?.type || '').match(/^VARCHAR\((\d+)\)/i)
  return m ? parseInt(m[1], 10) : null
}

module.exports = {
  async up(queryInterface, Sequelize) {
    if (!(await hasTable(queryInterface, ONDC_ORDERS))) return

    let desc = await queryInterface.describeTable(ONDC_ORDERS)
    for (const [name, definition] of Object.entries(COLUMNS(Sequelize))) {
      if (!desc[name]) await queryInterface.addColumn(ONDC_ORDERS, name, definition)
    }

    // Shrink anything the first attempt created at 255. Skipped when the widest
    // stored value would not survive the change, so this can never truncate data.
    desc = await queryInterface.describeTable(ONDC_ORDERS)
    for (const [column, width] of Object.entries(NARROW)) {
      const existing = currentLength(desc, column)
      if (existing === null || existing <= width) continue

      const [[row]] = await queryInterface.sequelize.query(
        `SELECT MAX(CHAR_LENGTH(\`${column}\`)) AS maxLen FROM \`${ONDC_ORDERS}\``
      )
      if ((row?.maxLen || 0) > width) {
        console.log(
          `Skipping narrow of ${ONDC_ORDERS}.${column} to ${width}: ` +
          `longest stored value is ${row.maxLen} chars`
        )
        continue
      }
      await queryInterface.changeColumn(ONDC_ORDERS, column, COLUMNS(Sequelize)[column])
    }

    const existingIndexes = await queryInterface.showIndex(ONDC_ORDERS)
    const existingNames = new Set(existingIndexes.map((i) => i.name))
    for (const idx of INDEXES) {
      if (!existingNames.has(idx.name)) {
        await queryInterface.addIndex(ONDC_ORDERS, idx.fields, { name: idx.name })
      }
    }
  },

  async down(queryInterface, Sequelize) {
    if (!(await hasTable(queryInterface, ONDC_ORDERS))) return

    // Indexes first — MySQL refuses to drop a column an index still covers.
    const existingIndexes = await queryInterface.showIndex(ONDC_ORDERS)
    const existingNames = new Set(existingIndexes.map((i) => i.name))
    for (const idx of INDEXES) {
      if (existingNames.has(idx.name)) await queryInterface.removeIndex(ONDC_ORDERS, idx.name)
    }

    const desc = await queryInterface.describeTable(ONDC_ORDERS)
    for (const name of Object.keys(COLUMNS(Sequelize))) {
      if (desc[name]) await queryInterface.removeColumn(ONDC_ORDERS, name)
    }
  },
}
